import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { generateScene } from "@/lib/ai/doubao";
import { generateImage } from "@/lib/ai/seedream";
import type { HistoryEntry } from "@/lib/ai/types";
import { db, schema } from "@/lib/db";
import type { Node } from "@/lib/db/schema";
import { emitProgress } from "@/lib/events";
import type { Locale } from "@/lib/i18n/config";

const TREE_DEPTH = Number(process.env.TREE_DEPTH ?? 3); // total layers (root = layer 1)
const TREE_BREADTH = Number(process.env.TREE_BREADTH ?? 3);
const CONCURRENCY = Number(process.env.GEN_CONCURRENCY ?? 3);

export function newId(prefix: string) {
  return `${prefix}_${nanoid(12)}`;
}

export function totalNodesFor(depth: number, breadth: number) {
  let sum = 0;
  for (let i = 0; i < depth; i++) sum += breadth ** i;
  return sum;
}

export async function collectHistory(
  scriptId: string,
  leafNodeId: string,
): Promise<HistoryEntry[]> {
  const all = await db.query.nodes.findMany({
    where: eq(schema.nodes.scriptId, scriptId),
  });
  const byId = new Map(all.map((n) => [n.id, n]));
  const path: HistoryEntry[] = [];
  let cursor: string | null = leafNodeId;
  while (cursor) {
    const node = byId.get(cursor);
    if (!node) break;
    path.unshift({
      narrative: node.narrative,
      chosenOption: node.chosenOptionText ?? undefined,
    });
    cursor = node.parentId ?? null;
  }
  return path;
}

type GenerateOneInput = {
  scriptId: string;
  nodeId: string;
  parentId: string | null;
  isLeaf: boolean;
};

async function generateOneScene({
  scriptId,
  nodeId,
  parentId,
  isLeaf,
}: GenerateOneInput): Promise<{ ok: boolean; node: Node | null }> {
  try {
    const script = await db.query.scripts.findFirst({
      where: eq(schema.scripts.id, scriptId),
    });
    if (!script) throw new Error("script not found");

    const history = parentId ? await collectHistory(scriptId, parentId) : [];

    await db
      .update(schema.nodes)
      .set({ status: "generating_text" })
      .where(eq(schema.nodes.id, nodeId));

    const scene = await generateScene(script.locale as Locale, {
      character: script.characterSetup,
      world: script.worldSetup,
      style: script.stylePrompt,
      history,
    });

    await db
      .update(schema.nodes)
      .set({
        narrative: scene.narrative,
        options: isLeaf ? [] : scene.options,
        status: "generating_image",
      })
      .where(eq(schema.nodes.id, nodeId));

    const style = script.stylePrompt || defaultStyle(script.locale as Locale);
    const framedPrompt = `${style}. ${script.characterSetup}. ${scene.imagePrompt}`;

    const { imageUrl } = await generateImage({
      prompt: framedPrompt,
      scriptId,
      fileId: nodeId,
    });

    await db
      .update(schema.nodes)
      .set({ imageUrl, status: "ready" })
      .where(eq(schema.nodes.id, nodeId));

    const updated = await db.query.nodes.findFirst({
      where: eq(schema.nodes.id, nodeId),
    });
    return { ok: true, node: updated ?? null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[generateOneScene] failed", nodeId, message);
    await db
      .update(schema.nodes)
      .set({ status: "failed", errorMessage: message })
      .where(eq(schema.nodes.id, nodeId));
    return { ok: false, node: null };
  } finally {
    await bumpProgress(scriptId);
  }
}

async function bumpProgress(scriptId: string) {
  const all = await db.query.nodes.findMany({
    where: eq(schema.nodes.scriptId, scriptId),
  });
  const ready = all.filter((n) => n.status === "ready").length;
  const failed = all.filter((n) => n.status === "failed").length;
  await db
    .update(schema.scripts)
    .set({ readyScenes: ready })
    .where(eq(schema.scripts.id, scriptId));
  emitProgress(`script:${scriptId}`, "progress", {
    ready,
    failed,
    total: all.length,
  });
}

async function runInBatches<T>(
  items: T[],
  batchSize: number,
  fn: (item: T) => Promise<void>,
) {
  for (let i = 0; i < items.length; i += batchSize) {
    await Promise.all(items.slice(i, i + batchSize).map(fn));
  }
}

export async function buildStoryTree(
  scriptId: string,
  rootNodeId: string,
  depth = TREE_DEPTH,
  breadth = TREE_BREADTH,
) {
  const total = totalNodesFor(depth, breadth);

  await db
    .update(schema.scripts)
    .set({ generationStatus: "generating", totalScenes: total, readyScenes: 0 })
    .where(eq(schema.scripts.id, scriptId));
  emitProgress(`script:${scriptId}`, "started", { total });

  const rootResult = await generateOneScene({
    scriptId,
    nodeId: rootNodeId,
    parentId: null,
    isLeaf: depth <= 1,
  });

  if (!rootResult.ok || !rootResult.node) {
    await finalize(scriptId, "partial_failure");
    return;
  }

  let currentLayer: Node[] = [rootResult.node];
  for (let layer = 2; layer <= depth; layer++) {
    const isLeafLayer = layer === depth;
    const nextLayer: Node[] = [];
    const nodesToProcess = currentLayer
      .flatMap((parent) => {
        const opts = parent.options ?? [];
        return opts.slice(0, breadth).map((optText, i) => ({
          parent,
          optionIndex: i,
          optionText: optText,
        }));
      });

    // Pre-create all node rows for this layer so DB has correct total early
    const pending: Array<{
      nodeId: string;
      parentId: string;
      optionIndex: number;
      optionText: string;
    }> = [];
    for (const p of nodesToProcess) {
      const nodeId = newId("nd");
      await db.insert(schema.nodes).values({
        id: nodeId,
        scriptId,
        parentId: p.parent.id,
        chosenOptionIndex: p.optionIndex,
        chosenOptionText: p.optionText,
        status: "pending",
        narrative: "",
      });
      pending.push({
        nodeId,
        parentId: p.parent.id,
        optionIndex: p.optionIndex,
        optionText: p.optionText,
      });
    }
    await bumpProgress(scriptId);

    await runInBatches(pending, CONCURRENCY, async (p) => {
      const res = await generateOneScene({
        scriptId,
        nodeId: p.nodeId,
        parentId: p.parentId,
        isLeaf: isLeafLayer,
      });
      if (res.ok && res.node) nextLayer.push(res.node);
    });

    currentLayer = nextLayer;
    if (!currentLayer.length) break;
  }

  const all = await db.query.nodes.findMany({
    where: eq(schema.nodes.scriptId, scriptId),
  });
  const failed = all.filter((n) => n.status === "failed").length;
  await finalize(scriptId, failed > 0 ? "partial_failure" : "ready");
}

async function finalize(
  scriptId: string,
  status: "ready" | "partial_failure",
) {
  await db
    .update(schema.scripts)
    .set({ generationStatus: status })
    .where(eq(schema.scripts.id, scriptId));
  emitProgress(`script:${scriptId}`, "done", { status });
}

export async function retryScene(nodeId: string) {
  const node = await db.query.nodes.findFirst({
    where: eq(schema.nodes.id, nodeId),
  });
  if (!node) return;

  const siblings = node.parentId
    ? await db.query.nodes.findMany({
        where: eq(schema.nodes.parentId, node.parentId),
      })
    : [];
  const hasChildren = (
    await db.query.nodes.findMany({
      where: eq(schema.nodes.parentId, node.id),
    })
  ).length > 0;

  await db
    .update(schema.nodes)
    .set({ status: "pending", errorMessage: null })
    .where(eq(schema.nodes.id, nodeId));

  await generateOneScene({
    scriptId: node.scriptId,
    nodeId: node.id,
    parentId: node.parentId,
    isLeaf: !hasChildren,
  });
}

function defaultStyle(locale: Locale) {
  return locale === "en"
    ? "Shoujo manga style, clean lines, soft palette"
    : "日系少女漫风，线条清晰，柔和色调";
}
