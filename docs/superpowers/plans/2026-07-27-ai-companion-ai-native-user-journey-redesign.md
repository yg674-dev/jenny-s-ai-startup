# AI Companion AI-Native User Journey Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redraw the existing bilingual dual-audience User Journey HTML so onboarding leads into a persistent AI-native relationship loop with guarded state updates, consented memory, proactive companionship, and isolated safety exits.

**Architecture:** Keep one self-contained HTML file with a 1720px SVG canvas. Each audience remains an independent two-lane flow: the upper lane shows observable user actions and experiences, while the lower `Agent & LLM System Layer` shows policy, context, decision, state, memory, and scheduling. Normal paths run left to right; the only loop-back uses a dedicated outer gutter and the only risk path uses a separate right-side rail.

**Tech Stack:** HTML5, embedded CSS, inline SVG, local browser or headless Chrome for validation.

## Global Constraints

- Modify `ai-companion-dual-audience-user-story-flow.html` in place.
- Deliver HTML only; do not generate or commit a PNG.
- Keep `Flow A` for adults and `Flow B` for teens.
- The product is a software AI companion Agent; do not include robot or hardware control.
- Use only horizontal and vertical connectors.
- Do not route connectors through cards or merge unrelated paths.
- Rename the lower lane to `Agent & LLM System Layer / Agent 与大模型系统层`.
- The LLM may propose state and memory changes but may not commit them directly.
- Adult and teen policy, data, relationship, memory, and proactive-contact rules remain isolated.
- Teen flow has no romantic mode, open chat, sexual content, fixed personality label, or open-ended relationship memory.

---

### Task 1: Rebuild the page shell and visual grammar

**Files:**
- Modify: `ai-companion-dual-audience-user-story-flow.html`

**Interfaces:**
- Consumes: The approved design spec at `docs/superpowers/specs/2026-07-27-ai-companion-ai-native-user-journey-redesign.md`.
- Produces: A self-contained HTML shell with the final classes, markers, lane labels, and canvas geometry used by Tasks 2 and 3.

- [ ] **Step 1: Replace the title and product framing**

Use this exact product framing:

```html
<h1>AI Native 持续关系循环</h1>
<p class="dek">一次设置，持续共创。用户的每次聊天、语音、剧情选择和小游戏行为都会进入可审核的 Agent 决策链路，形成新的回复、动作、剧情、关系状态与后续陪伴。</p>
```

The three principle cards must cover:

```text
Experience loop / 每次互动留下可控后果
State governance / LLM 只提出变化，规则系统审核后落库
Safety boundary / 主动陪伴不以依赖、内疚或付费刺激关系
```

- [ ] **Step 2: Rebuild the SVG canvas**

Set the SVG to:

```html
<svg viewBox="0 0 1720 2680" role="img" aria-labelledby="chart-title chart-desc">
```

Use these fixed regions:

```text
Shared entry: y=40..190
Flow A shell: y=230..1390
Flow B shell: y=1450..2585
Footer scope note: y=2615..2660
Lane rail width: 118px
Flow content starts: x=190
Risk rail: x=1580..1650
```

- [ ] **Step 3: Add explicit visual groups**

Each audience flow must contain:

```html
<g class="section-label onboarding-label">...</g>
<g class="section-label loop-label">...</g>
```

The visible labels are:

```text
One-time Onboarding / 一次性设置
Persistent Relationship Loop / 持续关系循环
```

- [ ] **Step 4: Run static shell checks**

Run:

```bash
rg -n "AI Native 持续关系循环|Agent & LLM System Layer|One-time Onboarding|Persistent Relationship Loop|viewBox=\"0 0 1720 2680\"" ai-companion-dual-audience-user-story-flow.html
```

Expected: all five patterns exist.

### Task 2: Draw the adult onboarding and persistent relationship loop

**Files:**
- Modify: `ai-companion-dual-audience-user-story-flow.html`

**Interfaces:**
- Consumes: CSS node classes, arrow markers, section labels, and Flow A shell from Task 1.
- Produces: A complete adult user story whose approved state and memory changes feed the visible experience and next proactive touch.

- [ ] **Step 1: Draw the adult onboarding**

Place five user-layer cards left to right:

```text
Confirm Adult Entry / 确认成人入口
Choose Relationship / 选择关系契约
Set Boundaries / 设置关系边界
Story Discovery / 剧情式相识
Review Profile / 确认人格假设
```

Place four aligned system cards beneath them:

```text
Consent & Policy Gate / 同意与策略网关
Relationship Contract / 关系契约状态
Discovery Story Planner / 相识剧情规划
Profile Hypothesis / 人格与偏好假设
```

Connect each row left to right. Use short vertical connectors only where a user action invokes its system counterpart.

- [ ] **Step 2: Draw the adult interaction loop**

Place these user-layer cards:

```text
Interact / 发起互动
text · voice · story · mini-game

Experience Output / 获得新体验
reply · action · story · relationship change

Feedback & Control / 反馈与控制
continue · ignore · reject · edit · delete

Proactive Touch / 后续主动陪伴
reason shown · quiet hours · opt out
```

Place these system cards in one left-to-right row:

```text
Input + Safety / 输入理解与前置安全
Context Assembler / 上下文组装
Decision Harness / 回复与行为规划
State Transition Guard / 状态变更审核
State & Memory Commit / 状态与记忆落库
Proactive Scheduler / 主动陪伴调度
```

Connect:

```text
Interact ↓ Input + Safety
Input + Safety → Context Assembler → Decision Harness
Decision Harness → State Transition Guard → State & Memory Commit
State & Memory Commit ↑ Experience Output
Experience Output → Feedback & Control
Feedback & Control ↓ Proactive Scheduler
Proactive Scheduler ↑ Proactive Touch
Proactive Touch → Interact through one outer green return path
```

- [ ] **Step 3: Add the adult safety exit**

Add one dedicated right-side node:

```text
Pause & Human Support / 暂停生成与真人支持
deterministic template · regional resource
```

Route one red dashed line from `Input + Safety` to the right-side safety rail and then to this node. Do not connect the safety exit back into the normal generation path.

- [ ] **Step 4: Verify adult content**

Run:

```bash
rg -n "Input \\+ Safety|Context Assembler|Decision Harness|State Transition Guard|State & Memory Commit|Proactive Scheduler|Pause & Human Support" ai-companion-dual-audience-user-story-flow.html
```

Expected: every adult loop component exists once inside Flow A.

### Task 3: Draw the teen onboarding and constrained story loop

**Files:**
- Modify: `ai-companion-dual-audience-user-story-flow.html`

**Interfaces:**
- Consumes: CSS node classes, markers, section labels, and Flow B shell from Task 1.
- Produces: A separate teen story flow with constrained choices, minimal preference state, opt-in reminders, and an immediate risk pause.

- [ ] **Step 1: Draw the teen onboarding**

Place four user-layer cards:

```text
Teen Entry / 青少年入口
Choose Story Partner / 选择故事伙伴
Set Comfort Boundary / 设置内容边界
Start Structured Story / 开始结构化剧情
```

Place three system cards beneath them:

```text
Teen Policy Gate / 青少年策略网关
Approved Story Graph / 审核剧情图谱
Minimal Preference / 最小化偏好状态
```

- [ ] **Step 2: Draw the constrained teen loop**

Place these user-layer cards:

```text
Choose & Play / 选择与小游戏
Story Experience / 新剧情与角色反馈
Review & Control / 继续 · 重玩 · 换故事 · 停止
Opt-in Reminder / 明确同意的安全提醒
```

Place these system-layer cards:

```text
Choice + Safety / 选择理解与持续安全
Constrained Story Decision / 受限剧情决策
Preference State Guard / 偏好状态审核
Progress Commit / 进度与舒适度落库
Reminder Scheduler / 安全提醒调度
```

The state guard stores only:

```text
story progress
interests
content comfort
safety settings
```

- [ ] **Step 3: Add the teen safety exit and boundary note**

Add:

```text
Story Paused / 剧情暂停
trusted adult · regional crisis resource
```

The risk line exits from `Choice + Safety` to a dedicated right-side red rail. Add a neutral note that explicitly states:

```text
No romance, open chat, sexual content, fixed personality label, or open-ended relationship memory.
无恋人模式、开放聊天、性内容、固定人格标签或开放式关系记忆。
```

- [ ] **Step 4: Verify teen constraints**

Run:

```bash
rg -n "Teen Policy Gate|Approved Story Graph|Minimal Preference|Constrained Story Decision|Preference State Guard|Progress Commit|No romance|无恋人模式" ai-companion-dual-audience-user-story-flow.html
```

Expected: all constrained teen components and the explicit boundary note exist.

### Task 4: Validate semantics, connector geometry, and browser rendering

**Files:**
- Modify if needed: `ai-companion-dual-audience-user-story-flow.html`
- Temporary validation artifact only: `/private/tmp/ai-companion-ai-native-user-journey.png`

**Interfaces:**
- Consumes: The complete HTML from Tasks 1-3.
- Produces: A verified HTML with no missing labels, page errors, clipped flow shell, diagonal SVG segments, or connectors crossing node rectangles.

- [ ] **Step 1: Run markup and content checks**

Run:

```bash
git diff --check -- ai-companion-dual-audience-user-story-flow.html
```

Run:

```bash
rg -c "Flow A · Adult Companion|Flow B · Teen Story|Agent & LLM System Layer|State Transition Guard|Preference State Guard" ai-companion-dual-audience-user-story-flow.html
```

Expected: each required label is present and `git diff --check` prints nothing.

- [ ] **Step 2: Load the HTML in a browser**

Open:

```text
file:///Users/bytedance/Documents/jenny%E2%80%98s%20startup%20idea/ai-companion-dual-audience-user-story-flow.html
```

Verify:

```text
document.title contains "AI Native"
SVG viewBox is "0 0 1720 2680"
scrollWidth is at least 1700
there are no page errors
```

- [ ] **Step 3: Render a temporary full-page screenshot**

Render at a 1760px-wide viewport and 2x scale to:

```text
/private/tmp/ai-companion-ai-native-user-journey.png
```

This image is for inspection only and must not be copied into the repository.

- [ ] **Step 4: Inspect connector routing**

Visually verify:

```text
no connector passes through a card
no normal and risk lines overlap
the adult proactive return is the only normal loop-back line
the teen reminder return is visually separate from the risk rail
all labels sit next to their own segment
both flow shells are fully visible
```

- [ ] **Step 5: Commit the HTML**

```bash
git add ai-companion-dual-audience-user-story-flow.html
git commit -m "feat: redraw AI-native companion user journey"
```
