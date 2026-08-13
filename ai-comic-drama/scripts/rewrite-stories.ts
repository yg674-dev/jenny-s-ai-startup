/**
 * 一次性重写两个故事：加长 narrative + 加男主 + 乙女向画风。
 * 数据在 stories-data.json（避 quote 冲突）
 * 用法：node --env-file=.env.local $(pnpm exec which tsx) scripts/rewrite-stories.ts [yuye|bianli|both]
 */
import Database from "better-sqlite3";
import { promises as fs, existsSync } from "node:fs";
import path from "node:path";
import OpenAI from "openai";
import data from "./stories-data.json" with { type: "json" };

const DB_PATH = process.env.SQLITE_PATH ?? "./dev.db";
const db = new Database(DB_PATH);

const ark = new OpenAI({
  apiKey: process.env.DOUBAO_API_KEY!,
  baseURL:
    process.env.DOUBAO_ENDPOINT ?? "https://ark.cn-beijing.volces.com/api/v3",
});
const IMAGE_MODEL =
  process.env.DOUBAO_IMAGE_MODEL ?? "doubao-seedream-4-0-250828";
const PUBLIC_DIR = path.join(process.cwd(), "public", "generated");
const CONCURRENCY = 3;

type Seed = {
  narrative: string;
  imagePrompt: string;
  options: string[];
  chosen?: { i: number; text: string };
  children?: Seed[];
};

type ScriptRewrite = {
  id: string;
  title: string;
  characterSetup: string;
  worldSetup: string;
  stylePrompt: string;
  rootNodeId: string;
  tree: Seed;
};

const YUYE = (data as Record<string, ScriptRewrite>).yuye;
const BIANLI = (data as Record<string, ScriptRewrite>).bianli;

function countNodes(node: Seed): number {
  return 1 + (node.children?.reduce((sum, c) => sum + countNodes(c), 0) ?? 0);
}

function insertTree(script: ScriptRewrite) {
  db.prepare("DELETE FROM scripts WHERE id = ?").run(script.id);
  const now = Math.floor(Date.now() / 1000);
  db.prepare(
    `INSERT INTO scripts (id, locale, title, character_setup, world_setup, style_prompt, root_node_id, generation_status, total_scenes, ready_scenes, created_at, updated_at)
     VALUES (?, 'zh', ?, ?, ?, ?, ?, 'generating', ?, 0, ?, ?)`,
  ).run(
    script.id,
    script.title,
    script.characterSetup,
    script.worldSetup,
    script.stylePrompt,
    script.rootNodeId,
    countNodes(script.tree),
    now,
    now,
  );

  const insertNode = db.prepare(
    `INSERT INTO nodes (id, script_id, parent_id, chosen_option_index, chosen_option_text, narrative, image_url, options, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, NULL, ?, 'pending', ?)`,
  );

  let counter = 0;
  const nextId = () => `nd_r2_${script.id.slice(-4)}_${counter++}`;

  function walk(node: Seed, parentId: string | null, ownId: string) {
    insertNode.run(
      ownId,
      script.id,
      parentId,
      node.chosen?.i ?? null,
      node.chosen?.text ?? null,
      node.narrative,
      JSON.stringify(node.options),
      now,
    );
    if (node.children) {
      for (const c of node.children) walk(c, ownId, nextId());
    }
  }
  walk(script.tree, null, script.rootNodeId);
}

function collectAllScenes(
  script: ScriptRewrite,
): Array<{ id: string; imagePrompt: string }> {
  const out: Array<{ id: string; imagePrompt: string }> = [];
  let counter = 0;
  const nextId = () => `nd_r2_${script.id.slice(-4)}_${counter++}`;

  function walk(node: Seed, ownId: string) {
    out.push({ id: ownId, imagePrompt: node.imagePrompt });
    if (node.children) {
      for (const c of node.children) walk(c, nextId());
    }
  }
  walk(script.tree, script.rootNodeId);
  return out;
}

async function clearOldImages(scriptId: string) {
  const dir = path.join(PUBLIC_DIR, scriptId);
  if (existsSync(dir)) {
    await fs.rm(dir, { recursive: true, force: true });
  }
  await fs.mkdir(dir, { recursive: true });
}

async function generateImageFor(
  script: ScriptRewrite,
  node: { id: string; imagePrompt: string },
): Promise<void> {
  const fullPrompt = `${script.stylePrompt}. ${script.characterSetup}. ${node.imagePrompt}`;
  const resp = await ark.images.generate({
    model: IMAGE_MODEL,
    prompt: fullPrompt,
    size: "864x1152",
    n: 1,
    response_format: "url",
  });
  const url = resp.data?.[0]?.url;
  if (!url) throw new Error("no url");
  const abs = path.join(PUBLIC_DIR, script.id, `${node.id}.png`);
  const res = await fetch(url);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(abs, buf);

  db.prepare(
    "UPDATE nodes SET image_url = ?, status = 'ready' WHERE id = ?",
  ).run(`/generated/${script.id}/${node.id}.png`, node.id);
  const ready = db
    .prepare("SELECT COUNT(*) as n FROM nodes WHERE script_id = ? AND status = 'ready'")
    .get(script.id) as { n: number };
  db.prepare("UPDATE scripts SET ready_scenes = ? WHERE id = ?").run(
    ready.n,
    script.id,
  );
}

async function runInBatches<T>(
  items: T[],
  batchSize: number,
  fn: (item: T, idx: number) => Promise<void>,
) {
  for (let i = 0; i < items.length; i += batchSize) {
    await Promise.all(
      items.slice(i, i + batchSize).map((it, k) => fn(it, i + k)),
    );
  }
}

async function rewriteOne(script: ScriptRewrite) {
  console.log(`\n=== ${script.title} (${script.id}) ===`);
  console.log("1. 写入新剧情到 DB...");
  insertTree(script);
  console.log("   已插入", countNodes(script.tree), "幕");

  console.log("2. 清理旧图...");
  await clearOldImages(script.id);

  console.log("3. 生成新图（乙女向）...");
  const scenes = collectAllScenes(script);
  let done = 0;
  await runInBatches(scenes, CONCURRENCY, async (scene) => {
    try {
      await generateImageFor(script, scene);
      done++;
      console.log(`   [${done}/${scenes.length}] ✓ ${scene.id}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.log(`   [FAIL] ${scene.id}: ${msg}`);
      db.prepare(
        "UPDATE nodes SET status = 'failed', error_message = ? WHERE id = ?",
      ).run(msg, scene.id);
    }
  });

  const failed = db
    .prepare("SELECT COUNT(*) as n FROM nodes WHERE script_id = ? AND status = 'failed'")
    .get(script.id) as { n: number };
  const finalStatus = failed.n > 0 ? "partial_failure" : "ready";
  db.prepare("UPDATE scripts SET generation_status = ? WHERE id = ?").run(
    finalStatus,
    script.id,
  );
  console.log(`4. 完成: ${finalStatus} (失败 ${failed.n})`);
}

async function main() {
  const which = process.argv[2] ?? "both";
  if (which === "yuye" || which === "both") await rewriteOne(YUYE);
  if (which === "bianli" || which === "both") await rewriteOne(BIANLI);
  console.log("\nDone.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
