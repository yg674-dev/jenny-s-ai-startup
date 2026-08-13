/**
 * 用 public/generated/scr_FK2Z4Y7l8txs 里的 12 张现有图，
 * 重建"雨夜书店"剧本树到 DB。narrative 手写，不调 LLM，零花费。
 */
import Database from "better-sqlite3";
import { readdirSync } from "node:fs";
import { join } from "node:path";

const SCRIPT_ID = "scr_FK2Z4Y7l8txs";
const IMG_DIR = join(process.cwd(), "public", "generated", SCRIPT_ID);
const DB_PATH = process.env.SQLITE_PATH ?? "./dev.db";

const db = new Database(DB_PATH);

// 磁盘上的 12 张图（按文件名字母序稳定）
const imgFiles = readdirSync(IMG_DIR)
  .filter((f) => f.endsWith(".png"))
  .sort();
console.log(`发现 ${imgFiles.length} 张图`);

const now = Math.floor(Date.now() / 1000);
const img = (fname: string) => `/generated/${SCRIPT_ID}/${fname}`;

// 手写剧本树：1 根 + 3 层 1 + 9 层 2 = 13 幕（但我们只有 12 张图，最后一个叶子会缺图）
type SceneSeed = {
  narrative: string;
  options: string[];
  chosen?: { i: number; text: string };
  children?: SceneSeed[];
  imageFile: string | null; // null = 用占位
};

const tree: SceneSeed = {
  narrative:
    '1998 年的雨夜，上海的弄堂浸在湿漉漉的橘色灯光里。林见收拢风衣领口，脚步在青石板上打了个滑——她抬头，看见巷子尽头那盏摇晃的灯下，一间旧书店的门半敞着。\n林见：以前从没见过这家店。',
  options: ["推门走进旧书店探查", "驻足门外静静观察", "转身撑伞离开弄堂"],
  imageFile: imgFiles[0],
  children: [
    {
      chosen: { i: 0, text: "推门走进旧书店探查" },
      narrative:
        "门轴发出低哑的呻吟，一股陈纸与檀香混杂的气息扑面而来。林见眯起眼适应昏暗，指尖触到门框上剥落的红漆。店内书架高耸如墙，尽头一盏台灯孤零零地亮着，照亮一张空着的藤椅——藤椅还在轻轻摇晃，像是刚有人起身离开。",
      options: ["走向那张藤椅", "先浏览门口的书架", "喊一声试探有没有人"],
      imageFile: imgFiles[1],
      children: [
        {
          chosen: { i: 0, text: "走向那张藤椅" },
          narrative:
            "林见踩着吱呀的木地板慢慢靠近。藤椅还留有余温，扶手上摊着一本翻到一半的书，纸页泛黄发脆。她低头一看，扉页写着自己的名字——用毛笔，繁体字，墨迹像是刚干。",
          options: [],
          imageFile: imgFiles[2],
        },
        {
          chosen: { i: 1, text: "先浏览门口的书架" },
          narrative:
            "书脊都磨得看不清字，林见随手抽出一本，封面浮凸的烫金字在灯下若隐若现——《民国旧事·卷三》。她翻开，第一页赫然是自己今天出门时的天气记录。",
          options: [],
          imageFile: imgFiles[3],
        },
        {
          chosen: { i: 2, text: "喊一声试探有没有人" },
          narrative:
            "林见：有人吗？\n声音在书架间来回反弹，却没得到回应。片刻，藤椅后方深处传来一声细碎的翻书声——像有人听见了她，但选择不回话。",
          options: [],
          imageFile: imgFiles[4],
        },
      ],
    },
    {
      chosen: { i: 1, text: "驻足门外静静观察" },
      narrative:
        "雨顺着屋檐淌下来，在灯泡周围织出一层朦胧光晕。林见屏住呼吸微微探身向门内张望——昏黄灯光里，书架像墙壁一样层层叠到深处，柜台后面空无一人，但一只黑猫从书堆上跳下，绿眼睛正正好好盯着她。",
      options: ["等黑猫先靠近", "轻声呼唤黑猫", "退后一步藏进阴影"],
      imageFile: imgFiles[5],
      children: [
        {
          chosen: { i: 0, text: "等黑猫先靠近" },
          narrative:
            "黑猫踱到门槛边停下，尾巴慢慢卷起。它没有看林见，而是抬头望向她身后——像是在看什么她看不见的东西。林见忽然感到后颈一凉。",
          options: [],
          imageFile: imgFiles[6],
        },
        {
          chosen: { i: 1, text: "轻声呼唤黑猫" },
          narrative:
            "林见：过来。\n黑猫歪了歪脑袋，突然张嘴——发出的却不是猫叫，而是一个老人低哑的笑声。笑声在雨夜里格外清晰。",
          options: [],
          imageFile: imgFiles[7],
        },
        {
          chosen: { i: 2, text: "退后一步藏进阴影" },
          narrative:
            "林见的脚跟撞到身后一个硬物。她低头，是一把湿透的黑伞——柄上挂着一张纸条，字迹娟秀：谢谢你今晚没有进去。",
          options: [],
          imageFile: imgFiles[8],
        },
      ],
    },
    {
      chosen: { i: 2, text: "转身撑伞离开弄堂" },
      narrative:
        "林见撑开伞转身，雨点密集地砸在伞面上。她刚迈出两步，身后忽然传来一声闷响，像是厚重的书砸在木地板上。她脚步顿住，却没有回头。",
      options: ["假装没听见继续走", "回头看一眼", "跑出弄堂"],
      imageFile: imgFiles[9],
      children: [
        {
          chosen: { i: 0, text: "假装没听见继续走" },
          narrative:
            "林见加快脚步。走到弄堂口，她终于忍不住回头一望——那家书店已经不见了，只剩一堵灰砖墙，墙上用石灰潦草地写着两个字：早退。",
          options: [],
          imageFile: imgFiles[10],
        },
        {
          chosen: { i: 1, text: "回头看一眼" },
          narrative:
            "灯下的书店门大敞。门内深处站着一个人，穿着和她一模一样的米色风衣，戴着一模一样的银框眼镜——那人抬起头，冲她轻轻笑了一下。",
          options: [],
          imageFile: imgFiles[11],
        },
        {
          chosen: { i: 2, text: "跑出弄堂" },
          narrative:
            "林见撒腿就跑。她跑出弄堂口，回头一看——弄堂空无一人，那盏摇晃的灯已经熄灭，好像从来没有过。只有雨还在下。",
          options: [],
          imageFile: null, // 只有 12 张图，最后一叶缺
        },
      ],
    },
  ],
};

// 写入 script
db.prepare("DELETE FROM scripts WHERE id = ?").run(SCRIPT_ID);
db.prepare(
  `INSERT INTO scripts (id, locale, title, character_setup, world_setup, style_prompt, root_node_id, generation_status, total_scenes, ready_scenes, created_at, updated_at)
   VALUES (?, 'zh', ?, ?, ?, ?, ?, 'ready', ?, ?, ?, ?)`,
).run(
  SCRIPT_ID,
  "雨夜书店",
  "17 岁少女林见，短黑发，戴银框眼镜，穿米色风衣，性格谨慎但好奇",
  "90 年代末上海弄堂雨夜，一家旧书店门口挂着一盏摇晃的灯",
  "日系少女漫风，线条清晰，柔和色调",
  "nd_K3o-qgOmmj2B",
  13,
  imgFiles.length,
  now,
  now,
);

const insertNode = db.prepare(
  `INSERT INTO nodes (id, script_id, parent_id, chosen_option_index, chosen_option_text, narrative, image_url, options, status, created_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
);

let nodeCounter = 0;
function makeId() {
  return `nd_rebuilt_${nodeCounter++}`;
}

function insert(
  seed: SceneSeed,
  parentId: string | null,
  ownId: string,
) {
  const status = seed.imageFile ? "ready" : "failed";
  insertNode.run(
    ownId,
    SCRIPT_ID,
    parentId,
    seed.chosen?.i ?? null,
    seed.chosen?.text ?? null,
    seed.narrative,
    seed.imageFile ? img(seed.imageFile) : null,
    JSON.stringify(seed.options),
    status,
    now,
  );
  if (seed.children) {
    for (const child of seed.children) {
      insert(child, ownId, makeId());
    }
  }
}

insert(tree, null, "nd_K3o-qgOmmj2B");

const n = db
  .prepare("SELECT COUNT(*) as n FROM nodes WHERE script_id = ?")
  .get(SCRIPT_ID) as { n: number };
console.log(`重建完成：${n.n} 幕，${imgFiles.length} 张图已复用`);
