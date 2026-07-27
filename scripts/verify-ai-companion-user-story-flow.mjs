import { readFileSync } from "node:fs";

const file = new URL(
  "../ai-companion-dual-audience-user-story-flow.html",
  import.meta.url,
);
const html = readFileSync(file, "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const required = [
  "Flow A",
  "Flow B",
  "User Layer",
  "LLM Layer",
  "Age Gate",
  "朋友",
  "家人",
  "恋人",
  "生活伙伴",
  "结构化剧情",
  "无开放聊天",
  "Safety Orchestrator",
  "画像拒绝",
  "降低触达频率",
  "真人支持",
];

for (const text of required) {
  assert(html.includes(text), `Missing required text: ${text}`);
}

assert(html.includes("<svg"), "Missing SVG");
assert(html.includes("viewBox=\"0 0 1700"), "Unexpected SVG width");
assert(html.includes("marker-end"), "Missing arrow markers");
assert(html.includes("@media print"), "Missing print stylesheet");
assert(html.includes("overflow-x: auto"), "Missing mobile horizontal scroll");
assert(
  (html.match(/class="lane-title"/g) ?? []).length === 4,
  "Expected exactly four swimlanes",
);
assert(
  (html.match(/class="connector/g) ?? []).length >= 24,
  "Not enough flow connectors",
);
assert(!/<line\b/i.test(html), "Use orthogonal paths instead of SVG lines");
assert(!/<img\b/i.test(html), "Decorative images are out of scope");
assert(!/TBD|TODO|待补|Lorem Ipsum/i.test(html), "Placeholder text found");

const connectorPaths = [
  ...html.matchAll(/<path class="connector[^"]*" d="([^"]+)"/g),
].map((match) => match[1]);

assert(connectorPaths.length >= 24, "Connector paths were not parsed");
for (const path of connectorPaths) {
  assert(
    !/[LQCAS]/i.test(path),
    `Connector is not orthogonal: ${path}`,
  );
}

console.log("AI companion flow verification passed.");
