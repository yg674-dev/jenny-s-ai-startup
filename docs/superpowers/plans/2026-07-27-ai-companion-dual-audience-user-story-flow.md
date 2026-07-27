# AI 陪伴产品双人群 User Story 泳道图 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 创建一个本地可打开的单页 HTML，用双 Flow、双泳道展示成人开放陪伴与青少年结构化剧情的用户层和大模型层 User Story。

**Architecture:** 单个 HTML 内嵌 CSS 与 SVG。共享入口通过年龄判断分流至 Flow A 与 Flow B；每个 Flow 分为 User Layer 和 LLM Layer，使用正交 SVG 连接线展示主路径、拒绝/降级路径和高风险升级。

**Tech Stack:** HTML5、CSS、SVG、零依赖 Node.js 静态校验、浏览器本地预览。

## Global Constraints

- 只生成 HTML，不生成 PNG。
- 画布约 1700px，允许小屏横向滚动。
- 页面包含两个独立 Flow；每个 Flow 恰好包含用户层和大模型层两条泳道。
- 成人提供朋友、家人、恋人、生活伙伴关系。
- 青少年可自主注册，但只进入结构化剧情；无恋人模式和开放聊天。
- 主要连接线必须水平/垂直正交，不穿过节点。
- 高风险路径必须绕开陪伴人格并进入确定性安全支持。
- 节点使用中英双语标题与短说明。

---

## File Structure

- Create: `scripts/verify-ai-companion-user-story-flow.mjs`
  - 检查双 Flow、泳道、关键节点、安全边界、SVG 和打印样式。
- Create: `ai-companion-dual-audience-user-story-flow.html`
  - 唯一交付物；内嵌样式、图例、说明和 SVG 流程图。

### Task 1: 建立静态验收测试

**Files:**
- Create: `scripts/verify-ai-companion-user-story-flow.mjs`

**Interfaces:**
- Consumes: `ai-companion-dual-audience-user-story-flow.html`
- Produces: 成功输出 `AI companion flow verification passed.`，失败退出码为 1。

- [ ] **Step 1: 写入失败优先校验脚本**

脚本读取 HTML 并检查：

```js
const required = [
  "Flow A", "Flow B", "User Layer", "LLM Layer", "Age Gate",
  "朋友", "家人", "恋人", "生活伙伴",
  "结构化剧情", "无开放聊天", "Safety Orchestrator",
  "画像拒绝", "降低触达频率", "真人支持"
];
```

同时断言存在 `<svg`、`marker-end`、`@media print`，不存在占位文本、`<img` 和对角线 `<line>`。

- [ ] **Step 2: 运行测试并确认失败**

Run:

```bash
"/Users/bytedance/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node" scripts/verify-ai-companion-user-story-flow.mjs
```

Expected: 因 HTML 尚未创建而失败。

- [ ] **Step 3: 提交测试**

```bash
git add scripts/verify-ai-companion-user-story-flow.mjs
git commit -m "test: define companion flow chart checks"
```

### Task 2: 创建双 Flow SVG 页面

**Files:**
- Create: `ai-companion-dual-audience-user-story-flow.html`
- Test: `scripts/verify-ai-companion-user-story-flow.mjs`

**Interfaces:**
- Consumes: 已确认设计规格和市场研究结论。
- Produces: 1700px 宽、可滚动和打印的双 Flow 双泳道图。

- [ ] **Step 1: 建立页面骨架与图例**

创建页眉、研究结论提示、颜色图例、共享入口与年龄判断菱形；使用 `#f4f6fa` 点阵背景和白色主卡片。

- [ ] **Step 2: 绘制 Flow A**

用户层节点：

```text
Register → Choose Relationship → Set Boundaries → Story Discovery
→ Review Profile → Daily Companion → Proactive Touch → Continue / Exit
```

大模型层节点：

```text
Consent Gateway → Relationship State Machine → Story Planner
→ Implicit Profile → Memory Manager → Dialogue + Safety
→ Proactive Scheduler → Human Support
```

画像拒绝回到短期上下文；主动触达被拒绝进入降低频率；高风险绕行到真人支持。

- [ ] **Step 3: 绘制 Flow B**

用户层节点：

```text
Self Register → Choose Story Partner → Set Comfort Boundary
→ Structured Story → Preference Review → Replay / Exit
```

大模型层节点：

```text
Teen Policy Gate → Disable Open Chat → Approved Story Graph
→ Constrained Options → Minimal Preference Memory
→ Safety Classifier → Safety Resources
```

13 岁以下结束；任何高风险信号暂停剧情并进入确定性资源。

- [ ] **Step 4: 增加范围说明与打印样式**

说明“非诊断性情绪支持”“成人/青少年模型和数据隔离”“关系记忆、主动触达与付费激励分权”；打印时保持 SVG 完整。

- [ ] **Step 5: 运行静态测试**

Run:

```bash
"/Users/bytedance/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node" scripts/verify-ai-companion-user-story-flow.mjs
```

Expected: `AI companion flow verification passed.`

- [ ] **Step 6: 提交 HTML**

```bash
git add ai-companion-dual-audience-user-story-flow.html
git commit -m "feat: add dual-audience companion user story flow"
```

### Task 3: 浏览器验证与交付

**Files:**
- Test: `ai-companion-dual-audience-user-story-flow.html`

**Interfaces:**
- Consumes: 完成的本地 HTML。
- Produces: 浏览器验证记录与最终文件链接。

- [ ] **Step 1: 浏览器加载**

通过本地预览打开 HTML，确认标题、Flow A、Flow B、四条泳道和 SVG 尺寸存在。

- [ ] **Step 2: 检查视觉与错误**

确认浏览器控制台无错误、文档宽高合理、主要连接线不穿过节点；检查 390px 视口可横向滚动且页面主体不被裁切。

- [ ] **Step 3: 最终验收**

运行：

```bash
git diff --check
"/Users/bytedance/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node" scripts/verify-ai-companion-user-story-flow.mjs
```

Expected: 无空白错误，测试通过。
