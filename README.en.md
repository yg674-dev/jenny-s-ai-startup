# jenny's ai startup

**English** · [中文](./README.md)

Early exploration: **an AI companion product for North American adults aged 45–70**.

Core theses:
- **The relationship contract comes before intimacy** — relationship type, boundaries, memory permissions and contact frequency are all set by the user up front, instead of drifting in over time or behind a paywall
- **Implicit personality inference instead of a questionnaire** — first contact happens through a 5-act comic drama; the user is never asked a single question, and the AI infers preferences from their choices
- **Every judgment is correctable, every boundary has an exit** — each personality assumption the system makes comes with its evidence, and the user can confirm, flip or delete it; data can be exported or permanently deleted at any time

Regulatory backdrop in North America: California SB 243 and the Illinois WOPR Act impose requirements on disclosure, memory and minor protection for AI companions. The whole product is designed compliance-first.

---

## Live artifacts

| # | Artifact | What it is | Open |
|---|---|---|---|
| 1 | **Interactive prototype · Flow A (with AI comic drama)** | The full playable adult flow: sign-up → consent → relationship → boundaries → pick a story → 5-act comic drama → personality inference → everyday companionship. Chinese/English toggle. Includes 4 comic drama shorts | [▶ Open directly](https://raw.githack.com/yg674-dev/jenny-s-ai-startup/main/ai-companion-flowA-prototype_4-drama.html) · [source](./ai-companion-flowA-prototype_4-drama.html) |
| 2 | **User journey · adult and teen swimlanes** | Journey map: the key touchpoints from trigger to retention, where regulation forks the path, and how Flow A (adult) differs from Flow B (teen) | [▶ Open directly](https://raw.githack.com/yg674-dev/jenny-s-ai-startup/main/ai-companion-dual-audience-user-story-flow.html) · [source](./ai-companion-dual-audience-user-story-flow.html) |
| 3 | **Market research · North America 2026** | Teardown of five benchmark products (Replika / Refind Self / Character.AI Stories / Wysa / ElliQ) plus demographics, needs and compliance risk | [▶ Open directly](https://raw.githack.com/yg674-dev/jenny-s-ai-startup/main/ai-companion-north-america-market-research-2026.html) · [source](./ai-companion-north-america-market-research-2026.html) · [evidence ledger](./research/ai-companion-market-evidence-2026.md) |

> raw.githack.com renders the HTML directly in the browser. If it loads slowly or you would rather not use it, clone the repo and open the files locally.

---

## How the interactive prototype flows

Flow A has 7 steps. Every step can be exited, and every step is explained:

```
01 · Self sign-up        Age · region · AI disclosure (SB 243 / WOPR)
02 · Consent gateway     4 independent toggles (disclosure / profiling / memory / proactive contact)
                         Declining any of them does not block you from continuing
03 · Relationship        Friend / family / romantic partner / life companion — determines the AI's tone,
                         what it may remember, and how often it reaches out
04 · Boundaries          Tone · memory depth · proactive contact frequency · do-not-disturb hours
05 · Meeting by story    Pick 1 of 4 shorts (5 acts each, bilingual); choices feed personality inference
06 · What I think I know Shows the 6-dimension personality read (social / info / support / pace /
                         expression / proactivity) + the evidence behind it + a way to correct it
07 · Everyday companion  Voice/text conversation · memory cards (it asks before writing) ·
                         proactive contact that states its reason · safety orchestrator
```

**The four comic drama shorts** (Step 05):

| Story | Characters | Mood |
|---|---|---|
| The Rainy Bookstore · 雨夜书店 | 17F × 19M silver-haired boy | Rainy night in a 1998 Shanghai lane, time slipping out of joint |
| Late-Night Convenience Store · 深夜便利店 | 22F night-shift clerk × 26M mysterious customer | Contemporary city, a 43-week ritual |
| Transmigrated to 1937 · 穿1937 | 26M modern doctor × Republican-era woman painter | Wartime Shanghai, displaced in time |
| The Repeating August 20th · 重复的八月二十 | 22M × a junior who remembers the loop | Time loop, campus mystery |

Every choice maps onto the 6 personality dimensions (soc/info/supp/pace/expr/proa). After the 5th act the user lands on the `What I think I know about you` page, where they can confirm or correct the AI's inferences one by one.

**Verification tools** (non-interactive; they check the prototype's logic):
- [`scripts/verify-ai-companion-user-story-flow.mjs`](./scripts/verify-ai-companion-user-story-flow.mjs)
- [`scripts/verify-market-report.mjs`](./scripts/verify-market-report.mjs)

---

## AI comic drama generator (`ai-comic-drama/` subdirectory)

The content backend that feeds the 4 shorts in Step 05. A **standalone, runnable Next.js app** that also works on its own as an interactive comic drama product.

- **Stack**: Next.js 15 · Drizzle + SQLite · Volcano Ark GLM-5.2 (story and branching) + Seedream 4.0 (3:4 portrait comic art)
- **Mode**: pre-generated, not real-time — the user supplies characters and a world, and a 4–6 layer story tree (40–120 acts) is generated in one pass, so playback has zero latency
- **Content**: 4 stories, 387 acts, 383 3:4 portrait comic images, fully bilingual
- **Cost reference**: a new 13-act story ≈ ¥3; each additional tree layer ≈ ¥18–24
- **Details**: [`ai-comic-drama/README.md`](./ai-comic-drama/README.md)

Run it locally:
```bash
cd ai-comic-drama
pnpm install
cp .env.example .env.local   # add your Volcano Ark API key (not needed to browse already-generated content)
pnpm dev                     # http://localhost:3000/zh or /en
```

---

## Repository structure

```
jenny-s-ai-startup/
├── ai-companion-flowA-prototype_4-drama.html      ← interactive prototype (Flow A + 4 dramas)
├── ai-companion-dual-audience-user-story-flow.html ← user journey map (adult + teen)
├── ai-companion-north-america-market-research-2026.html ← market research report
├── companion-drama-assets/                        ← the 25 drama images used by the prototype
├── ai-comic-drama/                                ← full-stack Next.js generator app
│   ├── src/                                       (framework code)
│   ├── scripts/                                   (generation / translation / tree-extension scripts)
│   ├── public/generated/                          (383 generated comic images)
│   ├── dev.db                                     (SQLite, 4 stories and 387 acts)
│   └── README.md
├── docs/                                          ← design docs (superpowers workflow)
├── research/
│   └── ai-companion-market-evidence-2026.md       ← market research evidence ledger
└── scripts/
    ├── verify-ai-companion-user-story-flow.mjs    ← prototype logic verification
    └── verify-market-report.mjs                   ← traces report data back to sources
```

---

## Roadmap

**Done**
- Market research + evidence ledger
- User journey map (adult and teen swimlanes)
- Complete Flow A interactive prototype (4 dramas, bilingual, 6-dimension personality inference, safety orchestrator)
- AI comic drama generator (4 stories, 387 acts in the database)

**Next**
- Flow B (teen) interactive prototype
- Finer-grained UX for proactive contact and memory cards
- Deploy to Vercel (the drama backend needs Turso in place of local SQLite)
- More stories (sweet romance / mystery / gentle)

---

## Author

Jenny · gaoyueming
