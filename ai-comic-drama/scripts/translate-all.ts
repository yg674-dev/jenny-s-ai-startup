/**
 * 批量翻译所有 script + node 到英文，写入 _en 列。
 * 只翻译 _en 还是 NULL 的字段（幂等，可断点续跑）。
 *
 * 前置条件：火山方舟账户有余额（这个脚本会调 GLM 翻译）
 * 用法: node --env-file=.env.local $(pnpm exec which tsx) scripts/translate-all.ts
 *
 * 成本估算: ~350 scripts+nodes × ~500 tokens = 175K tokens ≈ ¥0.5-1
 */
import Database from "better-sqlite3";
import OpenAI from "openai";

const DB_PATH = process.env.SQLITE_PATH ?? "./dev.db";
const db = new Database(DB_PATH);

const ark = new OpenAI({
  apiKey: process.env.DOUBAO_API_KEY!,
  baseURL:
    process.env.DOUBAO_ENDPOINT ?? "https://ark.cn-beijing.volces.com/api/v3",
});
const MODEL = process.env.DOUBAO_LLM_MODEL ?? "glm-5-2-260617";
const CONCURRENCY = Number(process.env.TR_CONCURRENCY ?? 4);

// 兜底：不要让任何一个 promise reject 干掉整个进程
process.on("unhandledRejection", (r) =>
  console.error("[unhandledRejection]", r instanceof Error ? r.message : r),
);
process.on("uncaughtException", (e) => console.error("[uncaughtException]", e.message));

/* ============ prompt ============ */
const SYS = `You are a professional literary translator specialising in Chinese-to-English translation of interactive romance fiction (visual novels / otome).
Translate the given Chinese text to natural, evocative English suitable for a romance/light-mystery visual novel. Preserve:
- character names as pinyin (林见 → Lin Jian, 顾迟 → Gu Chi, 苏晚 → Su Wan, 沈砚 → Shen Yan, 周予 → Zhou Yu, 苏听晚 → Su Tingwan, 周烨 → Zhou Ye, 陆星河 → Lu Xinghe, 江野 → Jiang Ye)
- dialogue format ("Name: xxx" for spoken lines, kept on separate lines)
- 「」 quote marks converted to regular double quotes
- newlines and paragraph structure
Output ONLY the translated text. No preamble, no explanation, no markdown fences.`;

function safeParseJson(raw: string): unknown {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const m = cleaned.match(/\{[\s\S]*\}/) || cleaned.match(/\[[\s\S]*\]/);
    return m ? JSON.parse(m[0]) : null;
  }
}

async function translateText(zh: string): Promise<string> {
  if (!zh?.trim()) return "";
  const r = await ark.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: SYS },
      { role: "user", content: zh },
    ],
    temperature: 0.4,
    max_tokens: 2000,
  });
  return (r.choices[0]?.message?.content ?? "").trim();
}

async function translateArray(zhs: string[]): Promise<string[]> {
  if (!zhs.length) return [];
  const r = await ark.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content:
          SYS +
          "\n\nThe input will be a JSON array of Chinese option strings. Return a JSON array of English translations in the SAME order. Keep each translation short (4-10 English words) and action-oriented (verb first). Output valid JSON only.",
      },
      { role: "user", content: JSON.stringify(zhs) },
    ],
    temperature: 0.4,
    max_tokens: 800,
    response_format: { type: "json_object" },
  });
  const raw = r.choices[0]?.message?.content ?? "[]";
  const parsed = safeParseJson(raw);
  const arr = Array.isArray(parsed) ? parsed : (parsed as { options?: string[] })?.options;
  if (!Array.isArray(arr) || arr.length !== zhs.length) {
    throw new Error(`options 翻译失败或数量不匹配: ${raw.slice(0, 150)}`);
  }
  return arr.map(String);
}

async function runInBatches<T>(
  items: T[],
  n: number,
  fn: (t: T, i: number) => Promise<void>,
) {
  for (let i = 0; i < items.length; i += n) {
    await Promise.all(items.slice(i, i + n).map((it, k) => fn(it, i + k)));
  }
}

/* ============ scripts 表 ============ */
async function translateScripts() {
  const rows = db
    .prepare(
      "SELECT id, title, character_setup, world_setup, style_prompt, title_en, character_setup_en, world_setup_en, style_prompt_en FROM scripts",
    )
    .all() as Array<Record<string, string | null>>;
  console.log(`\n=== scripts (${rows.length} rows) ===`);
  for (const r of rows) {
    const patches: Record<string, string> = {};
    if (!r.title_en?.trim()) patches.title_en = await translateText(r.title!);
    if (!r.character_setup_en?.trim())
      patches.character_setup_en = await translateText(r.character_setup!);
    if (!r.world_setup_en?.trim())
      patches.world_setup_en = await translateText(r.world_setup!);
    if (!r.style_prompt_en?.trim() && r.style_prompt?.trim())
      patches.style_prompt_en = await translateText(r.style_prompt);
    if (!Object.keys(patches).length) {
      console.log(`  skip ${r.id} (已全部翻译)`);
      continue;
    }
    const keys = Object.keys(patches);
    const setClause = keys.map((k) => `${k} = ?`).join(", ");
    db.prepare(`UPDATE scripts SET ${setClause} WHERE id = ?`).run(
      ...keys.map((k) => patches[k]),
      r.id,
    );
    console.log(`  ✓ ${r.id} · ${r.title} · updated [${keys.join(", ")}]`);
  }
}

/* ============ nodes 表 ============ */
async function translateNodes() {
  const rows = db
    .prepare(
      "SELECT id, narrative, options, chosen_option_text, narrative_en, options_en, chosen_option_text_en FROM nodes WHERE status = 'ready'",
    )
    .all() as Array<Record<string, string | null>>;
  const todo = rows.filter(
    (r) =>
      (!r.narrative_en?.trim() && r.narrative?.trim()) ||
      (!r.chosen_option_text_en?.trim() && r.chosen_option_text?.trim()) ||
      (!r.options_en?.trim() && r.options?.trim() && r.options !== "[]"),
  );
  console.log(`\n=== nodes (${todo.length} / ${rows.length} 需要翻译) ===`);
  let done = 0;
  await runInBatches(todo, CONCURRENCY, async (r) => {
    try {
      const patches: Record<string, string> = {};
      if (!r.narrative_en?.trim() && r.narrative?.trim())
        patches.narrative_en = await translateText(r.narrative);
      if (!r.chosen_option_text_en?.trim() && r.chosen_option_text?.trim())
        patches.chosen_option_text_en = await translateText(r.chosen_option_text);
      if (!r.options_en?.trim() && r.options?.trim()) {
        const opts = JSON.parse(r.options) as string[];
        if (opts.length) {
          const en = await translateArray(opts);
          patches.options_en = JSON.stringify(en);
        }
      }
      if (Object.keys(patches).length) {
        const keys = Object.keys(patches);
        const setClause = keys.map((k) => `${k} = ?`).join(", ");
        db.prepare(`UPDATE nodes SET ${setClause} WHERE id = ?`).run(
          ...keys.map((k) => patches[k]),
          r.id,
        );
      }
      done++;
      if (done % 10 === 0 || done === todo.length)
        console.log(`  [${done}/${todo.length}] ✓ ${r.id}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      done++;
      console.log(`  [${done}/${todo.length}] ✗ ${r.id}: ${msg.slice(0, 80)}`);
    }
  });
}

async function main() {
  await translateScripts();
  await translateNodes();
  console.log("\n=== Done ===");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
