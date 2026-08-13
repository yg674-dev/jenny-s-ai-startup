# jenny's ai startup

早期探索：**面向北美 45–70 岁成人的 AI 陪伴产品**。

核心主张：
- **关系契约先于亲密度** —— 关系类型、边界、记忆权限、联系频率，全部由用户先定，不靠时间和付费慢慢滑进去
- **隐性人格推断替代问卷** —— 首次接触通过一段 5-幕漫剧完成，用户从没被问一道题，AI 从选择里推断偏好
- **判断可纠正、边界可退出** —— 系统给出的每一条人格假设都附依据，用户可确认、翻转、删除；随时可导出数据或永久删除

北美监管背景：加州 SB 243 + 伊利诺伊 WOPR Act 对 AI 陪伴的披露、记忆、青少年保护做出要求。整个产品围绕合规先行设计。

---

## Live 交付物

| # | 产物 | 说明 | 打开 |
|---|---|---|---|
| 1 | **交互原型 · Flow A（含 AI 漫剧）** | 完整成人版可玩流程：注册 → 同意 → 关系 → 边界 → 选剧本 → 5 幕漫剧 → 人格推断 → 日常陪伴。支持中英切换。含 4 个漫剧短篇 | [▶ 直接打开](https://raw.githack.com/yg674-dev/jenny-s-ai-startup/main/ai-companion-flowA-prototype_4-drama.html) · [源码](./ai-companion-flowA-prototype_4-drama.html) |
| 2 | **User Journey · 成人与青少年双泳道** | 用户旅程图：从触发到留存的关键触点、监管分岔、Flow A（成人）vs Flow B（青少年）差异 | [▶ 直接打开](https://raw.githack.com/yg674-dev/jenny-s-ai-startup/main/ai-companion-dual-audience-user-story-flow.html) · [源码](./ai-companion-dual-audience-user-story-flow.html) |
| 3 | **市场研究 · 北美 2026** | 五个标杆产品（Replika / Refind Self / Character.AI Stories / Wysa / ElliQ）拆解 + 人口统计 + 需求 + 合规风险 | [▶ 直接打开](https://raw.githack.com/yg674-dev/jenny-s-ai-startup/main/ai-companion-north-america-market-research-2026.html) · [源码](./ai-companion-north-america-market-research-2026.html) · [证据台账](./research/ai-companion-market-evidence-2026.md) |

> raw.githack.com 让浏览器直接渲染 HTML；如果加载慢或不方便，可以直接 clone 后本地打开。

---

## 交互原型是怎么走的

Flow A 一共 7 步，每一步都能退出、每一步都被解释：

```
01 · 自主注册      年龄 · 地区 · AI 身份披露（SB 243 / WOPR）
02 · 同意网关      4 个独立开关（披露 / 画像 / 记忆 / 主动联系）· 拒绝任一都不阻止继续
03 · 关系契约      朋友 / 家人 / 恋人 / 生活伴侣 —— 决定 AI 的语气、能记什么、多久联系
04 · 设置边界      语气 · 记忆深度 · 主动联系频率 · 免打扰时段
05 · 剧情式相识    从 4 个短篇里挑 1 个（每篇 5 幕、中英双语），选项影响人格推断
06 · 我猜到的你    展示 6 维度人格判断（社交/信息/陪伴/节奏/表达/主动）+ 依据 + 可纠正
07 · 日常陪伴      语音/文字对话 · 记忆卡片（写入前询问）· 主动联系带原因 · 安全编排器
```

**四个漫剧短篇**（Step 05）：

| 剧本 | 角色 | 氛围 |
|---|---|---|
| 雨夜书店 · The Rainy Bookstore | 17F × 19M 银发少年 | 1998 上海弄堂雨夜、时空错位 |
| 深夜便利店 · Late-Night Convenience Store | 22F 夜班店员 × 26M 神秘客 | 现代都市、43 周仪式感 |
| 穿1937 · Transmigrated to 1937 | 26M 现代医生 × 民国女画家 | 战时上海、时代错位 |
| 重复的八月二十 · The Repeating August 20th | 22M × 记得循环的学妹 | 时间循环、悬疑校园 |

每个选项都映射到 6 个人格维度（soc/info/supp/pace/expr/proa），5 幕结束后进入 `我猜到的你` 页面，用户可以逐条确认或纠正 AI 的推断。

**验证工具**（用来检查原型逻辑正确性、非交互）：
- [`scripts/verify-ai-companion-user-story-flow.mjs`](./scripts/verify-ai-companion-user-story-flow.mjs)
- [`scripts/verify-market-report.mjs`](./scripts/verify-market-report.mjs)

---

## AI 漫剧生成器（`ai-comic-drama/` 子目录）

给 Step 05 里那 4 个短篇供内容的生成后台。**独立可跑的 Next.js app**，也可以脱离 companion 单独作为一个互动漫剧产品。

- **架构**：Next.js 15 · Drizzle + SQLite · 火山方舟 GLM-5.2（剧情/分支）+ Seedream 4.0（3:4 竖版漫画）
- **模式**：预生成（不是实时）—— 用户填角色 + 世界观后，一次性生成 4-6 层剧情树（40-120 幕），玩的时候 0 延迟
- **内容**：4 个剧本、387 幕、383 张 3:4 竖版漫画图、中英双语全覆盖
- **成本参考**：13 幕新剧本 ≈ ¥3；每加深一层 ≈ ¥18-24
- **详情**：[`ai-comic-drama/README.md`](./ai-comic-drama/README.md)

本地跑：
```bash
cd ai-comic-drama
pnpm install
cp .env.example .env.local   # 填火山方舟 API key（浏览已生成内容不需要 key）
pnpm dev                     # http://localhost:3000/zh 或 /en
```

---

## 仓库结构

```
jenny-s-ai-startup/
├── ai-companion-flowA-prototype_4-drama.html      ← 交互原型（Flow A + 4 漫剧）
├── ai-companion-dual-audience-user-story-flow.html ← 用户旅程图（成人 + 青少年）
├── ai-companion-north-america-market-research-2026.html ← 市场研究报告
├── companion-drama-assets/                        ← 原型用到的 25 张漫剧图
├── ai-comic-drama/                                ← Next.js 生成器全栈应用
│   ├── src/                                       (框架代码)
│   ├── scripts/                                   (生成/翻译/扩树脚本)
│   ├── public/generated/                          (383 张已生成漫画图)
│   ├── dev.db                                     (SQLite，含 4 剧本 387 幕)
│   └── README.md
├── docs/                                          ← 设计文档（superpowers 工作流）
├── research/
│   └── ai-companion-market-evidence-2026.md       ← 市场研究证据台账
└── scripts/
    ├── verify-ai-companion-user-story-flow.mjs    ← 原型逻辑验证
    └── verify-market-report.mjs                   ← 研究报告数据回溯验证
```

---

## Roadmap

**已完成**
- 市场研究 + 证据台账
- 用户旅程图（成人 + 青少年双泳道）
- Flow A 完整交互原型（含 4 漫剧、中英双语、6 维人格推断、安全编排器）
- AI 漫剧生成器（4 剧本 387 幕落库）

**接下来**
- Flow B（青少年版）交互原型
- 主动联系 / 记忆卡片的更精细 UX
- 部署到 Vercel（漫剧后台需要接 Turso 替换本地 SQLite）
- 引入更多剧本（甜宠 / 悬疑 / 温柔向）

---

## 作者

Jenny · gaoyueming
