import { readFileSync } from "node:fs";

const path = new URL(
  "../ai-companion-north-america-market-research-2026.html",
  import.meta.url,
);
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
  "sources",
];

const requiredProducts = [
  "Replika",
  "Refind Self",
  "Character.AI Stories",
  "Wysa",
  "ElliQ",
];

const requiredEvidenceLabels = ["公开事实", "市场代理", "分析推断"];
const requiredModelTerms = [
  "关系状态机",
  "隐性人格",
  "结构化剧情",
  "规则系统与 LLM",
  "主动触达",
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
assert(
  html.includes('type="button"'),
  "Interactive controls must declare button type",
);
assert(html.includes("@media print"), "Missing print stylesheet");
assert(
  html.includes("@media (prefers-reduced-motion: reduce)"),
  "Missing reduced-motion support",
);
assert(html.includes("window.print()"), "Missing print action");
assert(
  (html.match(/target="_blank"/g) ?? []).length >= 12,
  "Not enough external source links",
);
assert(
  !/TBD|TODO|待补|Lorem Ipsum/i.test(html),
  "Placeholder text found",
);

console.log("Market report verification passed.");
