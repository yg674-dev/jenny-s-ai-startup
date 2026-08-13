/**
 * 从 DB 抽 4 个剧本 × 5 幕线性路径，生成 companion HTML 所需的 STORIES 数据结构。
 * 输出 JSON 到 stdout。
 */
import Database from "better-sqlite3";
import { promises as fs } from "node:fs";
import { existsSync } from "node:fs";
import path from "node:path";

const db = new Database(process.env.SQLITE_PATH ?? "./dev.db");
const PUBLIC_DIR = path.join(process.cwd(), "public", "generated");
const ASSETS_DIR = path.join(
  path.dirname(process.cwd()),
  "companion-drama-assets",
);

/** 每个剧本的根 + 走 option 0/0/0/0 直到 5 幕（不到就换 idx） */
const SCRIPTS = [
  { id: "scr_FK2Z4Y7l8txs", slug: "yuye", meta: {
    title_zh: "雨夜书店", title_en: "The Rainy Bookstore",
    subtitle_zh: "17F × 19M 银发少年 · 1998 上海",
    subtitle_en: "17F × 19M silver-haired boy · 1998 Shanghai",
  }, path: [0, 1, 2, 0] },
  { id: "scr_on_VaUZbkHte", slug: "bianli", meta: {
    title_zh: "深夜便利店", title_en: "Late-Night Convenience Store",
    subtitle_zh: "22F 夜班店员 × 26M 神秘客 · 第 43 周",
    subtitle_en: "22F night-shift × 26M mysterious customer · week 43",
  }, path: [0, 0, 0, 0] },
  { id: "scr_bhYX65Fvlx4T", slug: "穿1937", meta: {
    title_zh: "穿1937", title_en: "Transmigrated to 1937",
    subtitle_zh: "26M 现代医生 → 民国乱世 × 女画家",
    subtitle_en: "26M modern doctor → 1937 Shanghai × female painter",
  }, path: [0, 0, 0, 0] },
  { id: "scr_z7ifCGefJeY3", slug: "loop", meta: {
    title_zh: "重复的八月二十", title_en: "The Repeating August 20th",
    subtitle_zh: "22M 大四男生 × 记得循环的学妹",
    subtitle_en: "22M senior × classmate who remembers the loop",
  }, path: [0, 0, 0, 0] },
];

function walk(scriptId: string, indices: number[]) {
  const rootIds = db
    .prepare(
      "SELECT id FROM nodes WHERE script_id = ? AND parent_id IS NULL",
    )
    .all(scriptId) as { id: string }[];
  const rootId = rootIds[0]?.id;
  if (!rootId) return [];
  const nodes: Array<Record<string, unknown>> = [];
  const root = db
    .prepare("SELECT * FROM nodes WHERE id = ?")
    .get(rootId) as Record<string, unknown>;
  nodes.push(root);
  let cur = rootId;
  for (const idx of indices) {
    // 尝试指定 idx，如果没有子节点就换 0/1/2
    let k = db
      .prepare(
        "SELECT * FROM nodes WHERE parent_id = ? AND chosen_option_index = ?",
      )
      .get(cur, idx) as Record<string, unknown> | undefined;
    if (!k) {
      const any = db
        .prepare("SELECT * FROM nodes WHERE parent_id = ? ORDER BY chosen_option_index LIMIT 1")
        .get(cur) as Record<string, unknown> | undefined;
      if (!any) break;
      k = any;
    }
    nodes.push(k);
    cur = k.id as string;
  }
  return nodes;
}

async function ensureAssetsDir() {
  await fs.mkdir(ASSETS_DIR, { recursive: true });
}

async function copyImage(scriptId: string, nodeId: string, slug: string, sceneIdx: number) {
  const src = path.join(PUBLIC_DIR, scriptId, `${nodeId}.png`);
  if (!existsSync(src)) return null;
  const dstName = `${slug}-scene${sceneIdx + 1}.jpg`;
  const dst = path.join(ASSETS_DIR, dstName);
  await fs.copyFile(src, dst);
  return `./companion-drama-assets/${dstName}`;
}

async function main() {
  await ensureAssetsDir();
  const stories: Record<string, unknown>[] = [];
  for (const s of SCRIPTS) {
    const nodes = walk(s.id, s.path);
    const scriptRow = db
      .prepare("SELECT * FROM scripts WHERE id = ?")
      .get(s.id) as Record<string, unknown>;
    const scenes: Record<string, unknown>[] = [];
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      const isLeaf = i === nodes.length - 1;
      const imgPath = await copyImage(s.id, n.id as string, s.slug, i);
      const optsZh = n.options ? JSON.parse(n.options as string) : [];
      const optsEn = n.options_en ? JSON.parse(n.options_en as string) : optsZh;
      scenes.push({
        title_zh: `${s.meta.title_zh} · 第 ${i + 1} 幕`,
        title_en: `${s.meta.title_en} · Scene ${i + 1}`,
        img: imgPath,
        narrative_zh: n.narrative,
        narrative_en: n.narrative_en || n.narrative,
        options_zh: isLeaf ? [] : optsZh,
        options_en: isLeaf ? [] : optsEn,
        leaf: isLeaf,
      });
    }
    stories.push({
      id: s.slug,
      title_zh: s.meta.title_zh,
      title_en: s.meta.title_en,
      subtitle_zh: s.meta.subtitle_zh,
      subtitle_en: s.meta.subtitle_en,
      cover: scenes[0]?.img,
      character_zh: scriptRow.character_setup,
      character_en: scriptRow.character_setup_en,
      scenes,
    });
  }
  console.log(JSON.stringify(stories, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
