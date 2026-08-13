/**
 * 批量生成新剧本：seed → buildStoryTree LLM 生 3 层 → extend-tree 生第 4 层
 * 幂等：如果 title 已存在，跳过 create 直接续 extend
 * 用法: node --env-file=.env.local $(pnpm exec which tsx) scripts/generate-more.ts
 */
import Database from "better-sqlite3";
import { spawn } from "node:child_process";

const API = process.env.API_BASE ?? "http://localhost:3000";
const DB_PATH = process.env.SQLITE_PATH ?? "./dev.db";
const db = new Database(DB_PATH);

type Seed = {
  title: string;
  character: string;
  world: string;
  style: string;
};

const themes: Seed[] = [
  {
    title: "穿1937",
    character:
      "男主周烨，26 岁，现代心内科医生，深灰色短发，戴金丝细边眼镜，身高一米八三，理性寡言，戴表；女主苏听晚，24 岁，1937 年上海的独立女画家，长直黑发在颈后挽成一个松结，穿蓝灰色改良旗袍，指尖常沾颜料，眼睛沉静会看人",
    world:
      "1937 年 10 月的上海法租界。淞沪会战正在打，霞飞路的梧桐叶还在落，租界像一个玻璃罩子把战火挡在外面。防空警报偶尔响起，深夜有人在电台里唱苏州评弹。周烨在 2026 年的手术台上突然晕过去，醒来发现自己躺在一间旧式石库门二楼的木地板上，房东说他昏迷了三天",
    style:
      "民国怀旧插画风，电影分镜感，暖褐色调，柔和光影，精致人物特写，复古氛围，胶片颗粒感",
  },
  {
    title: "重复的八月二十",
    character:
      "男主陆星河，22 岁大四男生，寸头深棕发，健身型体格但气质安静，穿宽松白T恤和深蓝校服外套，微微斜挂帆布包；女主江野，21 岁大三理科女生，黑色齐肩短发前刘海一分为二，戴无框眼镜，穿男友风针织开衫，说话直白冷静",
    world:
      "2026 年 8 月 20 日，星期二。陆星河这一天已经重活了 17 次。每次醒来都是清晨 6 点整，天花板上的吊灯正在轻微摇晃。他试过做各种事——熬夜不睡、跑到城外、跳楼（不敢真跳）——都没用。第 17 次的清晨，他在食堂看见坐对面的江野悄悄跟他说了一句：你也在这个循环里对吧？",
    style:
      "日系青春校园漫画风，悬疑感构图，清新蓝白色调加冷调阴影，情绪细腻的人物特写，电影感光影",
  },
];

function findByTitle(title: string): string | null {
  const r = db
    .prepare("SELECT id FROM scripts WHERE title = ? LIMIT 1")
    .get(title) as { id: string } | undefined;
  return r?.id ?? null;
}

function pollScript(scriptId: string) {
  return db
    .prepare(
      "SELECT generation_status as status, ready_scenes as ready, total_scenes as total FROM scripts WHERE id = ?",
    )
    .get(scriptId) as { status: string; ready: number; total: number };
}

async function waitReady(scriptId: string, timeoutMs = 300_000): Promise<void> {
  const t0 = Date.now();
  let lastReady = -1;
  while (Date.now() - t0 < timeoutMs) {
    const s = pollScript(scriptId);
    if (s.ready !== lastReady) {
      console.log(
        `   [t=${Math.round((Date.now() - t0) / 1000)}s] ${s.status} ${s.ready}/${s.total}`,
      );
      lastReady = s.ready;
    }
    if (s.status === "ready" || s.status === "partial_failure") return;
    await new Promise((r) => setTimeout(r, 5000));
  }
  throw new Error(`超时: ${scriptId}`);
}

async function createScript(seed: Seed): Promise<string> {
  const res = await fetch(`${API}/api/scripts`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ locale: "zh", ...seed }),
  });
  if (!res.ok) throw new Error(`create failed: ${res.status} ${await res.text()}`);
  const { scriptId } = (await res.json()) as { scriptId: string };
  return scriptId;
}

async function retryFailedNodes(scriptId: string): Promise<void> {
  const failed = db
    .prepare("SELECT id FROM nodes WHERE script_id = ? AND status = 'failed'")
    .all(scriptId) as { id: string }[];
  if (!failed.length) return;
  console.log(`   补 ${failed.length} 个 failed 节点...`);
  for (const f of failed) {
    const res = await fetch(`${API}/api/generate/retry`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ nodeId: f.id }),
    });
    if (!res.ok) console.log(`     retry ${f.id} failed`);
  }
  // wait for retries to settle
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 4000));
    const remaining = db
      .prepare(
        "SELECT COUNT(*) as n FROM nodes WHERE script_id = ? AND status IN ('pending', 'generating_text', 'generating_image')",
      )
      .get(scriptId) as { n: number };
    if (remaining.n === 0) break;
  }
  // update script status
  const stillFailed = db
    .prepare("SELECT COUNT(*) as n FROM nodes WHERE script_id = ? AND status = 'failed'")
    .get(scriptId) as { n: number };
  db.prepare(
    "UPDATE scripts SET generation_status = ? WHERE id = ?",
  ).run(stillFailed.n > 0 ? "partial_failure" : "ready", scriptId);
  console.log(`   retry 完成，剩余失败: ${stillFailed.n}`);
}

function runExtendScript(scriptId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // 直接用 pnpm dlx tsx，避免 which/exec 问题
    const child = spawn(
      "pnpm",
      ["dlx", "tsx", "scripts/extend-tree.ts", scriptId],
      {
        cwd: process.cwd(),
        stdio: "inherit",
        env: { ...process.env },
      },
    );
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`extend failed with code ${code}`));
    });
  });
}

async function main() {
  for (const [i, seed] of themes.entries()) {
    console.log(
      `\n========== ${i + 1}/${themes.length}: ${seed.title} ==========`,
    );

    let scriptId = findByTitle(seed.title);
    if (scriptId) {
      console.log(`   已存在 scriptId = ${scriptId}，跳过 create`);
    } else {
      console.log("Step 1: 通过 API 触发 buildStoryTree（LLM 生 3 层）...");
      scriptId = await createScript(seed);
      console.log(`   scriptId = ${scriptId}`);
      console.log("Step 2: 等待 3 层生成完成（~2-3 分钟）...");
      await waitReady(scriptId);
    }

    console.log("Step 3: 补 failed 节点...");
    await retryFailedNodes(scriptId);

    console.log("Step 4: 用 extend-tree.ts 扩展到 4+ 层...");
    await runExtendScript(scriptId);

    const final = pollScript(scriptId);
    console.log(
      `\n${seed.title} 完成: ${final.status} ${final.ready}/${final.total}`,
    );
  }

  console.log("\n=== 全部完成 ===");
  for (const seed of themes) {
    const id = findByTitle(seed.title);
    if (id) console.log(`  ${seed.title}: http://localhost:3000/zh/scripts/${id}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
