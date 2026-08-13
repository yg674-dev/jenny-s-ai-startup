/**
 * 手写种入雨夜书店 (script + 5 node) 的 EN 内容。
 * 5 node 是 root → 推门 → 小声问 → 追问 → 追上他 这条线。
 * 其他 script 和 node 保持 EN 为 NULL，前端会自动 fallback 到中文。
 */
import Database from "better-sqlite3";

const db = new Database(process.env.SQLITE_PATH ?? "./dev.db");

/* ============ 剧本级 EN ============ */
db.prepare(
  `UPDATE scripts SET
     title_en = ?,
     character_setup_en = ?,
     world_setup_en = ?,
     style_prompt_en = ?
   WHERE id = 'scr_FK2Z4Y7l8txs'`,
).run(
  "The Rainy Bookstore",
  "Female lead Lin Jian, 17, high-school junior, chin-length black bob, silver round glasses, beige trench over a white sweater, cautious but curious. Male lead Gu Chi, 19, silver-white lightly waved short hair, deep grey turtleneck, pale and slender, amber eyes, distant tone but suddenly gentle at moments. Both have naturally adult proportions.",
  "Late autumn 1937 (author note: adjusted to fit a Shanghai-alley romance), a rainy night in a Shanghai lane. Wet flagstones catch the orange streetlight; at the end of the alley an old, always-empty bookshop has its door half-open tonight, a lantern swaying in the rain. The shop only appears on rainy nights.",
  "Shoujo manga style, otome illustration, soft-filter lighting, delicate character detail, pink-peach palette, dreamlike atmosphere.",
);

/* ============ 5 node EN ============ */
type NodeEnSeed = {
  id: string;
  chosenOptionText?: string;
  narrative: string;
  options: string[];
};

const SEEDS: NodeEnSeed[] = [
  {
    id: "nd_K3o-qgOmmj2B",
    narrative:
      "The evening rain hadn't stopped by midnight. Lin Jian hugged three library books to her chest, hunched through the narrow alley toward home. Nearly at her door, she froze — the always-empty shop on the corner had its light on tonight. A faded wooden sign hung above the half-open door. Through the veil of rain she saw a figure inside — silver-white hair catching the lamplight.\nLin Jian: When did a bookshop open on our alley?",
    options: [
      "Push the door open and step in",
      "Peek in from the doorway first",
      "Pretend you saw nothing and walk on",
    ],
  },
  {
    id: "nd_r2_8txs_0",
    chosenOptionText: "Push the door open and step in",
    narrative:
      "The door hinge let out a long moan; the wet air stayed behind her. Inside was deeper than it looked — bookshelves rose to the ceiling like two walls forming a narrow corridor. The air smelled of old paper and a touch of sandalwood. A desk lamp lit a single rattan chair at the far end — the silver-haired boy sat there, a heavy book in his lap, looking up at her. His amber eyes were almost translucent in the lamplight.\nGu Chi: Are you lost? Or just out of the rain?\nHis voice was gentler than she expected, but the words came out like something he asked every night. Lin Jian suddenly noticed her shoes were still dripping.",
    options: [
      "Politely say you’re just taking shelter",
      "Softly ask what kind of books he sells",
      "Blush, apologise, and turn to leave",
    ],
  },
  {
    id: "nd_r2_8txs_2",
    chosenOptionText: "Softly ask what kind of books he sells",
    narrative:
      "Lin Jian: What kind of books does this place sell?\nGu Chi didn’t answer right away. He stood, pulled a book from the nearest shelf, and handed it to her. The cover was deep blue, no title, only a tiny white jasmine stamped in gold.\nGu Chi: Open it.\nShe turned to the first page — and froze. The flyleaf held her own name in careful brush strokes: 「Lin Jian」, ink barely dry. Further in, she saw the handwriting of yesterday’s maths test, including the answer she had deliberately gotten wrong.\nLin Jian: This… how is this possible?\nGu Chi: The books here are written about whoever walks in. Yours — I’ve been waiting for you a long time.",
    options: [
      "Close the book and step back",
      "Flip to the last page to see what it says",
      "Push him: who are you, really",
    ],
  },
  {
    id: "nd_ext_Rd4NUFdi8W",
    chosenOptionText: "Push him: who are you, really",
    narrative:
      "Lin Jian: Who are you, really?\nGu Chi didn’t answer directly. He sat back into the rattan chair, and the heavy book on his lap fell open to a page — a fine ink drawing of this exact alley, precise enough to include her own house number.\nGu Chi: I’m just the one who keeps the books here. Tonight’s choices will be recorded. When you walk out that door, the rain will stop. Walk a little further and turn around — the shop will be gone.\nHe looked up.\nGu Chi: So whatever you want to ask, ask now.",
    options: [
      "Push out into the rain and chase him for one honest answer",
      "Look down and read the last page — your own ending",
      "Hold the book tight, turn, and walk home",
    ],
  },
  {
    id: "nd_ext_fespjhXb6o",
    chosenOptionText: "Push out into the rain and chase him for one honest answer",
    narrative:
      "She didn’t give herself time to think. The book slipped from her arms as she pushed out into the rain — the drops hit her glasses instantly, blurring the world into orange smears. She ran to the end of the alley, then turned.\nGu Chi was standing at the shop door. He hadn’t moved.\nLin Jian: Wait — just one honest sentence. I don’t care what it is.\nHe was silent for a long moment. The rain thinned between them.\nGu Chi: You’re not the first Lin Jian to run out. But you’re the first who came back to look at me.\nHe stepped back into the shop. The lamp behind him dimmed — not out, just dimmed — as if it were waiting for the next rainy night.\nLin Jian stood in the alley until the rain stopped. When she turned around one more time, the shop was gone. Only the wet stones, only the streetlight.\nIn her pocket, a single dry page. She didn’t open it yet.",
    options: [],
  },
];

const updateNode = db.prepare(
  `UPDATE nodes SET
     narrative_en = ?,
     options_en = ?,
     chosen_option_text_en = ?
   WHERE id = ?`,
);

for (const seed of SEEDS) {
  updateNode.run(
    seed.narrative,
    JSON.stringify(seed.options),
    seed.chosenOptionText ?? null,
    seed.id,
  );
}

console.log(`已种入雨夜书店 script EN + ${SEEDS.length} 幕 EN`);
console.log("其他 script / node 保持 EN 为 NULL，前端会 fallback 中文");
