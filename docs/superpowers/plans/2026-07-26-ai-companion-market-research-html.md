# AI 陪伴产品北美市场研究 HTML Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 制作一个自包含、中文、可本地打开的单页 HTML，完整呈现五个 AI 陪伴标杆产品的北美市场研究、用户画像、盈利方式、模型层实践与组合机会。

**Architecture:** 研究证据先进入一份 Markdown 证据台账，再由单个 HTML 文件承载全部页面内容、样式和轻量交互。一个零依赖 Node.js 校验脚本负责检查章节、产品、证据标签、来源链接、可访问性标记和打印样式，最后用浏览器验证桌面、移动端与打印布局。

**Tech Stack:** HTML5、原生 CSS、原生 JavaScript、Node.js 静态校验、浏览器本地预览。

## Global Constraints

- 最终交付必须是一个自包含 HTML 文件，CSS 和 JavaScript 内嵌。
- 中文为主，保留必要的英文产品名和行业术语。
- 不依赖登录、数据库、远程字体或运行时服务。
- 支持桌面端、移动端和打印/PDF。
- 重要数据必须显示口径、年份、地域、来源类型和可信度。
- 私营公司未披露北美份额时，不输出伪精确百分比。
- 模型实践必须区分“官方披露 / 可观察实践 / 分析推断”。
- Refind Self 必须明确标记为非 LLM 的行为识别实践。
- 页面不使用渐变、玻璃拟态、厚重阴影、Emoji 或装饰性图片。
- 研究范围仅包含市场与产品判断，不提供医疗、法律或投资建议。
- 最终不部署公开网站，除非用户后续明确要求。

---

## File Structure

- Create: `research/ai-companion-market-evidence-2026.md`
  - 记录所有核心数据、口径、来源 URL、访问日期、证据类型与限制。
- Create: `ai-companion-north-america-market-research-2026.html`
  - 唯一交付页面；包含全部内容、CSS、JavaScript 和打印样式。
- Create: `scripts/verify-market-report.mjs`
  - 零依赖静态校验；检查结构、必需内容、来源、可访问性和打印约束。
- Modify: `docs/superpowers/specs/2026-07-26-ai-companion-market-research-html-design.md`
  - 将状态更新为“用户已确认”。

### Task 1: 建立研究证据台账

**Files:**
- Create: `research/ai-companion-market-evidence-2026.md`

**Interfaces:**
- Consumes: 官方产品页面、政府文件、专业协会资料、Appfigures/Sensor Tower 市场数据。
- Produces: 每条证据的 `ID、结论、数值、年份、地域、证据类型、可信度、URL、限制`，供 HTML 文案和来源附录使用。

- [ ] **Step 1: 写入类别级市场证据**

记录以下已核实数据：

```markdown
| ID | 结论 | 数值与口径 | 地域/时间 | 类型 | 可信度 | 来源 | 限制 |
|---|---|---|---|---|---|---|---|
| MKT-01 | AI companion 移动端消费增长迅速 | 2025 H1 约 $82M；2025 全年预计 >$120M | 全球，2025 | 市场代理 | 中 | https://techcrunch.com/2025/08/12/ai-companion-apps-on-track-to-pull-in-120m-in-2025/ | 仅 App Store/Google Play IAP，不含网页、广告和硬件 |
| MKT-02 | 类别高度集中 | 头部 10% App 获得 89% 类别收入 | 全球，截至 2025-07 | 市场代理 | 中 | 同 MKT-01 | Appfigures 估算 |
| MKT-03 | 美国是最大消费市场 | 美国占 2023-2024 类别消费 57.4%，加拿大占 3.9% | 全球移动端，2023-2024 | 市场代理 | 中 | Appfigures Rise of AI Apps 2025, pp.61-62 | 不含网页收入 |
| MKT-04 | 美国是最大下载市场 | 美国占类别下载 30.5%，Q4 2024 占 38% | 全球移动端，2023-2024 | 市场代理 | 中 | Appfigures Rise of AI Apps 2025, pp.64-66 | 季度和累计口径不同 |
| MKT-05 | 类别用户年轻且男性偏多 | 65.4% 为 18-24；30.2% 为女性；50-64 占 13.3% | 全球移动端，2023-2024 | 市场代理 | 中 | Appfigures Rise of AI Apps 2025, p.68 | 非单一产品画像 |
```

- [ ] **Step 2: 写入青少年、成年人和老年需求证据**

加入：

```markdown
| DEM-01 | 72% 美国 13-17 岁青少年至少使用过一次 AI companion，超过一半定期使用 | 美国，2025 | 公开研究 | 高 | https://www.commonsensemedia.org/research/talk-trust-and-trade-offs-how-and-why-teens-use-ai-companions |
| DEM-02 | 54% 美国成年人至少有时感到孤立，50% 感到缺少陪伴 | 美国，2025 | 公开研究 | 高 | https://www.apa.org/news/press/releases/2025/11/nation-suffering-division-loneliness |
| DEM-03 | 纽约州 ElliQ 项目持续部署约 900 台设备 | 美国纽约州，2026 | 公开事实 | 高 | https://aging.ny.gov/node/11461 |
```

- [ ] **Step 3: 为五个产品建立统一证据表**

每个产品至少写入：

```markdown
- 北美份额代理
- 用户画像
- 价格和盈利方式
- 用户层机制
- 模型或算法层机制
- 年龄限制和医疗声明
- 可复用能力
- 证据缺口
```

必须使用以下官方入口：

```text
Replika:
https://help.replika.com/hc/en-us/articles/360046490131-How-do-I-change-my-relationship-status
https://help.replika.com/hc/en-us/articles/39551043419149-Choosing-a-Subscription
https://replika.com/legal/terms/en

Refind Self:
https://store.steampowered.com/app/2514960/Refind_Self/

Character.AI Stories:
https://blog.character.ai/introducing-stories-a-new-way-to-create-play-and-share-adventures-with-your-favorite-characters/
https://support.character.ai/hc/en-us/articles/42645561782555-Important-Changes-for-Teens-on-Character-ai

Wysa:
https://www.wysa.com/faq
https://www.wysa.com/cyp-uk

ElliQ:
https://elliq.com/products/membership
https://elliq.com/pages/faqs
https://aging.ny.gov/node/11461
```

- [ ] **Step 4: 检查证据台账**

Run:

```bash
rg -n 'TBD|TODO|待补|来源缺失' research/ai-companion-market-evidence-2026.md
```

Expected: 无输出。

- [ ] **Step 5: 提交证据台账**

```bash
git add research/ai-companion-market-evidence-2026.md
git commit -m "docs: add AI companion market evidence ledger"
```

### Task 2: 建立 HTML 静态验收测试

**Files:**
- Create: `scripts/verify-market-report.mjs`
- Test: `scripts/verify-market-report.mjs`

**Interfaces:**
- Consumes: `ai-companion-north-america-market-research-2026.html`
- Produces: 成功时输出 `Market report verification passed.`；任一验收条件缺失时退出码为 1。

- [ ] **Step 1: 写入失败优先的校验脚本**

```js
import { readFileSync } from "node:fs";

const path = new URL("../ai-companion-north-america-market-research-2026.html", import.meta.url);
const html = readFileSync(path, "utf8");

const requiredIds = [
  "main-content",
  "executive-summary",
  "methodology",
  "north-america-market",
  "product-deep-dives",
  "comparison-matrix",
  "audience-segments",
  "combined-opportunity",
  "business-model",
  "safety-regulation",
  "recommendations",
  "sources"
];

const requiredProducts = [
  "Replika",
  "Refind Self",
  "Character.AI Stories",
  "Wysa",
  "ElliQ"
];

const requiredEvidenceLabels = ["公开事实", "市场代理", "分析推断"];
const requiredModelTerms = [
  "关系状态机",
  "隐性人格",
  "结构化剧情",
  "规则系统与 LLM",
  "主动触达"
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

for (const id of requiredIds) {
  assert(html.includes(`id="${id}"`), `Missing section id: ${id}`);
}

for (const product of requiredProducts) {
  assert(html.includes(product), `Missing product: ${product}`);
}

for (const label of requiredEvidenceLabels) {
  assert(html.includes(label), `Missing evidence label: ${label}`);
}

for (const term of requiredModelTerms) {
  assert(html.includes(term), `Missing model practice: ${term}`);
}

assert(html.includes('class="skip-link"'), "Missing skip link");
assert(html.includes('aria-label="章节导航"'), "Missing navigation label");
assert(html.includes('type="button"'), "Interactive controls must declare button type");
assert(html.includes("@media print"), "Missing print stylesheet");
assert(html.includes("@media (prefers-reduced-motion: reduce)"), "Missing reduced-motion support");
assert(html.includes("window.print()"), "Missing print action");
assert((html.match(/target="_blank"/g) ?? []).length >= 12, "Not enough external source links");
assert(!/TBD|TODO|待补|Lorem Ipsum/i.test(html), "Placeholder text found");

console.log("Market report verification passed.");
```

- [ ] **Step 2: 运行测试并确认失败**

Run:

```bash
"/Users/bytedance/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node" scripts/verify-market-report.mjs
```

Expected: FAIL，错误为无法读取尚未创建的 HTML 文件。

- [ ] **Step 3: 提交验收测试**

```bash
git add scripts/verify-market-report.mjs
git commit -m "test: define market report acceptance checks"
```

### Task 3: 实现完整中文研究报告

**Files:**
- Create: `ai-companion-north-america-market-research-2026.html`
- Test: `scripts/verify-market-report.mjs`

**Interfaces:**
- Consumes: `research/ai-companion-market-evidence-2026.md`
- Produces: 规格中定义的自包含中文单页报告。

- [ ] **Step 1: 建立语义化页面骨架**

HTML 必须使用：

```html
<a class="skip-link" href="#main-content">跳到正文</a>
<header class="report-header">...</header>
<aside class="toc" aria-label="章节导航">...</aside>
<main id="main-content">
  <section id="executive-summary">...</section>
  <section id="methodology">...</section>
  <section id="north-america-market">...</section>
  <section id="product-deep-dives">...</section>
  <section id="comparison-matrix">...</section>
  <section id="audience-segments">...</section>
  <section id="combined-opportunity">...</section>
  <section id="business-model">...</section>
  <section id="safety-regulation">...</section>
  <section id="recommendations">...</section>
  <section id="sources">...</section>
</main>
```

- [ ] **Step 2: 实现编辑型视觉系统**

在内嵌 `<style>` 中定义并使用：

```css
:root {
  --canvas: #f7f6f2;
  --surface: #ffffff;
  --ink: #20211f;
  --muted: #6f716c;
  --line: #e4e2dc;
  --blue-bg: #e7f0f5;
  --blue: #315f76;
  --green-bg: #eaf0e8;
  --green: #3f6847;
  --yellow-bg: #f6efd9;
  --yellow: #84651b;
  --red-bg: #f7e8e7;
  --red: #8f403b;
  --content: 1180px;
}
```

正文使用系统中文字体，标题使用系统衬线字体；卡片边框为 `1px solid var(--line)`，圆角不超过 `12px`，不使用渐变和明显阴影。

- [ ] **Step 3: 写入市场概览与方法说明**

必须呈现：

```text
2025 H1 全球移动端消费额约 $82M
2025 全年预计超过 $120M
头部 10% 产品获得约 89% 类别收入
美国占 2023-2024 移动端消费 57.4%，加拿大占 3.9%
美国占类别下载 30.5%
65.4% 类别用户为 18-24 岁，50-64 岁占 13.3%
```

同时明确这些数字是 Appfigures 的移动端估算，不代表全部网页、B2B、硬件或医疗数字健康收入。

- [ ] **Step 4: 写入五个产品的统一深拆卡片**

每张卡片包含九个字段，并明确以下相对位置：

```text
Replika：成人关系型 AI 头部品牌；北美精确 MAU 和收入份额未公开。
Refind Self：人格识别游戏的利基验证案例；不属于持续陪伴市场份额。
Character.AI Stories：Character.AI 流量和角色生态延伸出的青少年结构化格式。
Wysa：数字心理健康/员工福利细分领先者；不与成人恋爱 companion 直接比较。
ElliQ：北美老年实体陪伴的代表性机构部署案例；规模仍为案例型。
```

- [ ] **Step 5: 写入模型层实践**

必须将模型层拆成：

```text
Replika：关系模式 + 记忆 + 用户反馈 + 订阅模型分层。
Refind Self：行为遥测 + 选择路径 + 决策时长 + 多周目一致性；非 LLM。
Character.AI Stories：角色设定 + 类型/前提 + 有限分支 + 受控生成 + 年龄体验隔离。
Wysa：结构化规则对话 + LLM 提示 + 临床审核工具库 + 危机边界。
ElliQ：主动调度 + 语音界面 + 长期偏好 + 活动推荐 + 照护者连接。
```

未公开的基础模型供应商、参数量和训练数据必须写“未公开”，不得猜测。

- [ ] **Step 6: 写入组合架构、商业模式和监管**

组合架构必须包含用户层与模型层；商业路径必须比较成人 D2C、中老年家庭订阅、青少年 B2B2C；监管必须覆盖 FTC/COPPA、FDA 医疗声明、Illinois WOPR、APA 建议和 Character.AI 未成年人政策变化。

- [ ] **Step 7: 运行静态验收测试**

Run:

```bash
"/Users/bytedance/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node" scripts/verify-market-report.mjs
```

Expected:

```text
Market report verification passed.
```

- [ ] **Step 8: 提交页面主体**

```bash
git add ai-companion-north-america-market-research-2026.html
git commit -m "feat: add Chinese AI companion market report"
```

### Task 4: 实现交互、响应式和打印体验

**Files:**
- Modify: `ai-companion-north-america-market-research-2026.html`
- Modify: `scripts/verify-market-report.mjs`
- Test: `scripts/verify-market-report.mjs`

**Interfaces:**
- Consumes: 页面章节、产品卡片和比较矩阵。
- Produces: 键盘可用的筛选、展开、目录高亮和打印操作。

- [ ] **Step 1: 扩展静态测试**

在校验脚本中加入：

```js
assert(html.includes('data-evidence-filter="all"'), "Missing evidence filter");
assert(html.includes('data-matrix-view="user"'), "Missing user-layer matrix view");
assert(html.includes('data-matrix-view="model"'), "Missing model-layer matrix view");
assert(html.includes('aria-expanded="false"'), "Missing expandable product details");
assert(html.includes("IntersectionObserver"), "Missing section observer");
assert(html.includes("scroll-margin-top"), "Missing anchored heading offset");
assert(html.includes("overflow-x: auto"), "Missing narrow-screen table overflow");
```

- [ ] **Step 2: 运行测试并确认失败**

Run:

```bash
"/Users/bytedance/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node" scripts/verify-market-report.mjs
```

Expected: FAIL，并指出第一个尚未实现的交互标记。

- [ ] **Step 3: 实现交互**

原生 JavaScript 必须：

```js
document.querySelectorAll("[data-evidence-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.evidenceFilter;
    document.querySelectorAll("[data-evidence-type]").forEach((item) => {
      item.hidden = filter !== "all" && item.dataset.evidenceType !== filter;
    });
  });
});

document.querySelectorAll("[data-expand-target]").forEach((button) => {
  button.addEventListener("click", () => {
    const panel = document.getElementById(button.dataset.expandTarget);
    const expanded = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!expanded));
    panel.hidden = expanded;
  });
});
```

目录高亮使用 `IntersectionObserver`，打印按钮调用 `window.print()`，所有状态变化同步更新 `aria-pressed` 或 `aria-expanded`。

- [ ] **Step 4: 实现移动端与打印样式**

必须包含：

```css
@media (max-width: 860px) {
  .report-shell { display: block; }
  .toc { position: sticky; top: 0; overflow-x: auto; }
  .metric-grid, .product-grid, .audience-grid { grid-template-columns: 1fr; }
}

@media print {
  .toc, .toolbar, .filter-controls, .expand-button { display: none !important; }
  body { background: #fff; color: #111; }
  section, article, table { break-inside: avoid; }
  a[href^="http"]::after { content: " (" attr(href) ")"; font-size: 9pt; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 5: 运行静态验收测试**

Run:

```bash
"/Users/bytedance/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node" scripts/verify-market-report.mjs
```

Expected:

```text
Market report verification passed.
```

- [ ] **Step 6: 提交交互与响应式体验**

```bash
git add ai-companion-north-america-market-research-2026.html scripts/verify-market-report.mjs
git commit -m "feat: add report interactions and print layout"
```

### Task 5: 浏览器验证与最终核对

**Files:**
- Modify if needed: `ai-companion-north-america-market-research-2026.html`
- Test: `scripts/verify-market-report.mjs`

**Interfaces:**
- Consumes: 完整 HTML。
- Produces: 桌面、移动端和打印均可读的最终文件。

- [ ] **Step 1: 启动本地预览**

Run:

```bash
python3 -m http.server 4173
```

Expected: 本地页面可通过 `http://127.0.0.1:4173/ai-companion-north-america-market-research-2026.html` 打开。

- [ ] **Step 2: 验证桌面端**

浏览器宽度设置为约 1440px，检查：

```text
左侧目录不遮挡正文
首屏可看到标题、结论和三个市场信号
所有表格标题、脚注和来源可读
五产品卡片字段一致
无横向页面溢出
无控制台错误
```

- [ ] **Step 3: 验证移动端**

浏览器宽度设置为约 390px，检查：

```text
目录可横向滚动
卡片为单列
表格在自身容器横向滚动
按钮点击区域不小于 44px
正文不被截断
```

- [ ] **Step 4: 验证交互与打印**

检查：

```text
证据筛选可切换并恢复全部
产品模型层详情可展开和收起
矩阵视图切换同步更新 aria-pressed
打印按钮打开打印对话框
打印预览隐藏目录和按钮，保留来源 URL
```

- [ ] **Step 5: 运行最终校验**

Run:

```bash
"/Users/bytedance/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node" scripts/verify-market-report.mjs
git diff --check
rg -n 'TBD|TODO|待补|Lorem Ipsum' ai-companion-north-america-market-research-2026.html research/ai-companion-market-evidence-2026.md
```

Expected:

```text
Market report verification passed.
```

其余命令无输出。

- [ ] **Step 6: 最终提交**

```bash
git add ai-companion-north-america-market-research-2026.html research/ai-companion-market-evidence-2026.md scripts/verify-market-report.mjs
git commit -m "chore: verify AI companion market report"
```

