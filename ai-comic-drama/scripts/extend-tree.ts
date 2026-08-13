/**
 * 把现有 3 层 × 3 分支的树，扩展到 4 层。
 * - 保留现有 13 幕（narrative + image 不动）
 * - 用 LLM 给 9 个叶子追加 3 个选项
 * - 为每个新选项生成一个新的第 4 层 leaf（narrative + image）
 *
 * 用法: node --env-file=.env.local $(pnpm exec which tsx) scripts/extend-tree.ts [scriptId|all]
 */
import Database from "better-sqlite3";
import { promises as fs } from "node:fs";
import { existsSync } from "node:fs";
import path from "node:path";
import { nanoid } from "nanoid";
import OpenAI from "openai";

const DB_PATH = process.env.SQLITE_PATH ?? "./dev.db";
const db = new Database(DB_PATH);

const ark = new OpenAI({
  apiKey: process.env.DOUBAO_API_KEY!,
  baseURL:
    process.env.DOUBAO_ENDPOINT ?? "https://ark.cn-beijing.volces.com/api/v3",
});
const LLM_MODEL = process.env.DOUBAO_LLM_MODEL ?? "glm-5-2-260617";
const IMAGE_MODEL =
  process.env.DOUBAO_IMAGE_MODEL ?? "doubao-seedream-4-0-250828";
const PUBLIC_DIR = path.join(process.cwd(), "public", "generated");
const CONCURRENCY = 3;

type NodeRow = {
  id: string;
  script_id: string;
  parent_id: string | null;
  chosen_option_index: number | null;
  chosen_option_text: string | null;
  narrative: string;
  image_url: string | null;
  options: string; // JSON string
  status: string;
};

type ScriptRow = {
  id: string;
  title: string;
  character_setup: string;
  world_setup: string;
  style_prompt: string;
};

function newId() {
  return `nd_ext_${nanoid(10)}`;
}

function safeParseJson(raw: string): Record<string, unknown> {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        /* fall through */
      }
    }
    throw new Error(`无法解析 JSON: ${raw.slice(0, 200)}`);
  }
}

function getNodePath(scriptId: string, leafId: string): NodeRow[] {
  const all = db
    .prepare("SELECT * FROM nodes WHERE script_id = ?")
    .all(scriptId) as NodeRow[];
  const byId = new Map(all.map((n) => [n.id, n]));
  const path: NodeRow[] = [];
  let cursor: string | null = leafId;
  while (cursor) {
    const n = byId.get(cursor);
    if (!n) break;
    path.unshift(n);
    cursor = n.parent_id;
  }
  return path;
}

/**
 * 只让 LLM 生 3 个"承接选项"，不改叶子的 narrative。
 * 输入：叶子所在的完整故事路径。
 * 输出：3 个从叶子结尾能承接出来的分支选项（继续剧情）。
 */
async function generateOptionsForLeaf(
  script: ScriptRow,
  leafPath: NodeRow[],
): Promise<string[]> {
  const historyBlock = leafPath
    .map((n, i) => {
      const chosen = n.chosen_option_text
        ? `\n（读者的选择：${n.chosen_option_text}）`
        : "";
      return `第 ${i + 1} 幕：${n.narrative}${chosen}`;
    })
    .join("\n\n");

  const system = `你是一名互动剧作家。用户给你一段已完成的故事片段（多幕），请你为最后一幕**接续**出 3 个不同方向的下一步选项。
每个选项 6-14 个中文字，动词开头，表达一个具体的动作或决定。不要复述剧情，只给"接下来做什么"的动作。
严格返回 JSON：{"options": ["...", "...", "..."]}`;

  const user = `【角色】${script.character_setup}

【世界观】${script.world_setup}

【已发生的剧情】
${historyBlock}

请为最后一幕生成 3 个接续动作选项。`;

  const resp = await ark.chat.completions.create({
    model: LLM_MODEL,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.9,
    max_tokens: 500,
    response_format: { type: "json_object" },
  });

  const raw = resp.choices[0]?.message?.content ?? "{}";
  const parsed = safeParseJson(raw);
  const options = Array.isArray(parsed.options)
    ? parsed.options.map((o: unknown) => String(o).trim()).filter(Boolean)
    : [];
  if (options.length < 3) throw new Error(`options 不足: ${raw.slice(0, 200)}`);
  return options.slice(0, 3);
}

/**
 * 给一个新的第 4 层 leaf 生 narrative + imagePrompt + 图。
 */
async function generateLeafContinuation(
  script: ScriptRow,
  parentPath: NodeRow[],
  chosenOption: string,
): Promise<{ narrative: string; imagePrompt: string; imageUrl: string; nodeId: string }> {
  const historyBlock = parentPath
    .map((n, i) => {
      const chosen = n.chosen_option_text
        ? `\n（读者的选择：${n.chosen_option_text}）`
        : "";
      return `第 ${i + 1} 幕：${n.narrative}${chosen}`;
    })
    .join("\n\n");

  const system = `你是一名互动剧作家兼分镜师。用户给你一段已完成的故事和读者做的最新选择，请你写出**下一幕也是最终一幕**——一个**开放式结局**。
开放式：留一个耐人寻味的场景、一句意味深长的话、一个未解的动作。不要强行收束、不要"从此他们幸福地生活在一起"式的圆满。让读者在心里自己延续。
narrative 180-280 字，中文，包含旁白和至少一句对白（用"角色名：xxx"格式）。imagePrompt 60-100 字中文，描述该幕的画面构图/人物姿态/氛围。
严格返回 JSON：{"narrative": "...", "imagePrompt": "..."}`;

  const user = `【角色】${script.character_setup}

【世界观】${script.world_setup}

【画风】${script.style_prompt}

【已发生的剧情】
${historyBlock}

【读者刚刚的选择】${chosenOption}

请写出结局这一幕。`;

  const resp = await ark.chat.completions.create({
    model: LLM_MODEL,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.9,
    max_tokens: 1500,
    response_format: { type: "json_object" },
  });

  const raw = resp.choices[0]?.message?.content ?? "{}";
  const parsed = safeParseJson(raw);
  const narrative = String(parsed.narrative ?? "").trim();
  const imagePrompt = String(parsed.imagePrompt ?? "").trim();
  if (!narrative || !imagePrompt) {
    throw new Error(`LLM 输出不完整: ${raw.slice(0, 200)}`);
  }

  const nodeId = newId();
  const fullPrompt = `${script.style_prompt}. ${script.character_setup}. ${imagePrompt}`;
  const imgResp = await ark.images.generate({
    model: IMAGE_MODEL,
    prompt: fullPrompt,
    size: "864x1152",
    n: 1,
    response_format: "url",
  });
  const remoteUrl = imgResp.data?.[0]?.url;
  if (!remoteUrl) throw new Error("no image url");

  const abs = path.join(PUBLIC_DIR, script.id, `${nodeId}.png`);
  await fs.mkdir(path.dirname(abs), { recursive: true });
  const dl = await fetch(remoteUrl);
  const buf = Buffer.from(await dl.arrayBuffer());
  await fs.writeFile(abs, buf);
  const imageUrl = `/generated/${script.id}/${nodeId}.png`;

  return { nodeId, narrative, imagePrompt, imageUrl };
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

async function extendScript(scriptId: string) {
  const script = db
    .prepare("SELECT * FROM scripts WHERE id = ?")
    .get(scriptId) as ScriptRow | undefined;
  if (!script) throw new Error("script not found");
  console.log(`\n=== ${script.title} (${scriptId}) ===`);

  // 清掉之前失败的扩展节点（可能是 JSON parse 失败的）
  const cleaned = db
    .prepare(
      "DELETE FROM nodes WHERE script_id = ? AND status = 'failed' AND id LIKE 'nd_ext_%'",
    )
    .run(scriptId);
  if (cleaned.changes) console.log(`清理失败的旧扩展节点: ${cleaned.changes}`);

  const allNodes = db
    .prepare("SELECT * FROM nodes WHERE script_id = ?")
    .all(scriptId) as NodeRow[];
  // 找需要处理的"原叶子"：options 空 或 options 有但缺子节点
  const parentCounts = new Map<string, number>();
  for (const n of allNodes) {
    if (n.parent_id) parentCounts.set(n.parent_id, (parentCounts.get(n.parent_id) ?? 0) + 1);
  }
  const leaves = allNodes.filter((n) => {
    if (n.status !== "ready") return false;
    const opts = JSON.parse(n.options || "[]");
    const childCount = parentCounts.get(n.id) ?? 0;
    // 原叶子：没有选项也没有子节点 (第 3 层)
    // 或：有选项但子节点少于选项数 (之前 fail 了)
    if (opts.length === 0 && childCount === 0) return true;
    if (opts.length > 0 && childCount < opts.length) return true;
    return false;
  });
  console.log(`发现 ${leaves.length} 个需要处理的节点（新叶子或缺子节点的）`);

  db.prepare("UPDATE scripts SET generation_status = 'generating' WHERE id = ?").run(scriptId);

  // Step 1: 给每个还没选项的叶子生 3 选项（并行）
  console.log("Step 1: 生成选项...");
  const optionsMap = new Map<string, string[]>();
  const needsOptions = leaves.filter(
    (l) => JSON.parse(l.options || "[]").length === 0,
  );
  const hasOptions = leaves.filter(
    (l) => JSON.parse(l.options || "[]").length > 0,
  );
  for (const l of hasOptions) optionsMap.set(l.id, JSON.parse(l.options));
  await runInBatches(needsOptions, CONCURRENCY, async (leaf) => {
    try {
      const p = getNodePath(scriptId, leaf.id);
      const opts = await generateOptionsForLeaf(script, p);
      optionsMap.set(leaf.id, opts);
      db.prepare("UPDATE nodes SET options = ? WHERE id = ?").run(
        JSON.stringify(opts),
        leaf.id,
      );
      console.log(`  ✓ ${leaf.id} → [${opts.join(" | ")}]`);
    } catch (e) {
      console.log(`  ✗ ${leaf.id}:`, e instanceof Error ? e.message : e);
    }
  });

  // Step 2: 为每个 (leaf, optIdx) 缺失的组合生成一个新的结局幕
  console.log("\nStep 2: 生成新结局幕...");
  const existingChildKeys = new Set<string>();
  for (const n of allNodes) {
    if (n.parent_id && n.status === "ready" && n.chosen_option_index !== null) {
      existingChildKeys.add(`${n.parent_id}::${n.chosen_option_index}`);
    }
  }
  const jobs: Array<{ parent: NodeRow; optIdx: number; optText: string }> = [];
  for (const leaf of leaves) {
    const opts = optionsMap.get(leaf.id);
    if (!opts) continue;
    for (let i = 0; i < opts.length; i++) {
      if (existingChildKeys.has(`${leaf.id}::${i}`)) continue; // 已存在
      jobs.push({ parent: leaf, optIdx: i, optText: opts[i] });
    }
  }
  console.log(`  需要生成 ${jobs.length} 个新结局幕`);

  let done = 0;
  const now = Math.floor(Date.now() / 1000);
  const insertNode = db.prepare(
    `INSERT INTO nodes (id, script_id, parent_id, chosen_option_index, chosen_option_text, narrative, image_url, options, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  await runInBatches(jobs, CONCURRENCY, async (job) => {
    try {
      const parentPath = getNodePath(scriptId, job.parent.id);
      const result = await generateLeafContinuation(script, parentPath, job.optText);
      insertNode.run(
        result.nodeId,
        scriptId,
        job.parent.id,
        job.optIdx,
        job.optText,
        result.narrative,
        result.imageUrl,
        JSON.stringify([]),
        "ready",
        now,
      );
      done++;
      console.log(`  [${done}/${jobs.length}] ✓ ${result.nodeId}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      done++;
      console.log(`  [${done}/${jobs.length}] ✗ ${msg}`);
      insertNode.run(
        newId(),
        scriptId,
        job.parent.id,
        job.optIdx,
        job.optText,
        "",
        null,
        JSON.stringify([]),
        "failed",
        now,
      );
    }
  });

  // Update script counts
  const finalNodes = db
    .prepare("SELECT status FROM nodes WHERE script_id = ?")
    .all(scriptId) as { status: string }[];
  const ready = finalNodes.filter((n) => n.status === "ready").length;
  const failed = finalNodes.filter((n) => n.status === "failed").length;
  const finalStatus = failed > 0 ? "partial_failure" : "ready";
  db.prepare(
    "UPDATE scripts SET total_scenes = ?, ready_scenes = ?, generation_status = ? WHERE id = ?",
  ).run(finalNodes.length, ready, finalStatus, scriptId);

  console.log(`\n${script.title} 扩展完成: 总 ${finalNodes.length} 幕、ready ${ready}、失败 ${failed}`);
}

async function main() {
  const arg = process.argv[2] ?? "all";
  const scriptIds: string[] =
    arg === "all"
      ? (db.prepare("SELECT id FROM scripts").all() as { id: string }[]).map((s) => s.id)
      : [arg];

  for (const id of scriptIds) {
    await extendScript(id);
  }
  console.log("\nDone.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
