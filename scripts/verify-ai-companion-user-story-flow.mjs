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
  "Agent &amp; LLM",
  "System Layer",
  "Agent 与大模型系统层",
  "Age Gate",
  "朋友",
  "家人",
  "恋人",
  "生活伙伴",
  "结构化剧情",
  "ONE-TIME ONBOARDING",
  "PERSISTENT RELATIONSHIP LOOP",
  "PERSISTENT STORY LOOP",
  "Input + Safety",
  "Context Assembler",
  "Decision Harness",
  "State Transition Guard",
  "State &amp; Memory Commit",
  "Proactive Scheduler",
  "Constrained Story Decision",
  "Preference State Guard",
  "Progress Commit",
  "No romance",
  "无恋人模式",
  "Pause &amp; Human Support",
  "Story Paused",
];

for (const text of required) {
  assert(html.includes(text), `Missing required text: ${text}`);
}

assert(html.includes("<svg"), "Missing SVG");
assert(html.includes("viewBox=\"0 0 1720 2680\""), "Unexpected SVG dimensions");
assert(html.includes("marker-end"), "Missing arrow markers");
assert(html.includes("@media print"), "Missing print stylesheet");
assert(html.includes("overflow-x: auto"), "Missing mobile horizontal scroll");
assert(
  (html.match(/class="lane-title"/g) ?? []).length === 8,
  "Expected exactly eight lane labels across four two-lane bands",
);
assert(
  (html.match(/class="connector/g) ?? []).length >= 40,
  "Not enough flow connectors",
);
assert(!/<line\b/i.test(html), "Use orthogonal paths instead of SVG lines");
assert(!/<img\b/i.test(html), "Decorative images are out of scope");
assert(!/TBD|TODO|待补|Lorem Ipsum/i.test(html), "Placeholder text found");

const connectorPaths = [
  ...html.matchAll(/<path class="connector[^"]*" d="([^"]+)"/g),
].map((match) => match[1]);

assert(connectorPaths.length >= 40, "Connector paths were not parsed");
for (const path of connectorPaths) {
  assert(
    !/[LQCAS]/i.test(path),
    `Connector is not orthogonal: ${path}`,
  );
}

const nodeRects = [
  ...html.matchAll(
    /<g class="node [^"]+">\s*<rect x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"\/>/g,
  ),
].map((match) => ({
  x: Number(match[1]),
  y: Number(match[2]),
  width: Number(match[3]),
  height: Number(match[4]),
}));

function segmentsFromPath(path) {
  const commands = [
    ...path.matchAll(/([MHV])\s*(-?[\d.]+)(?:\s+(-?[\d.]+))?/g),
  ];
  const segments = [];
  let x;
  let y;

  for (const command of commands) {
    const type = command[1];
    const first = Number(command[2]);
    const second = command[3] === undefined ? undefined : Number(command[3]);

    if (type === "M") {
      x = first;
      y = second;
      continue;
    }

    const nextX = type === "H" ? first : x;
    const nextY = type === "V" ? first : y;
    segments.push({ x1: x, y1: y, x2: nextX, y2: nextY });
    x = nextX;
    y = nextY;
  }

  return segments;
}

function crossesRectInterior(segment, rect) {
  const epsilon = 0.1;
  const left = rect.x + epsilon;
  const right = rect.x + rect.width - epsilon;
  const top = rect.y + epsilon;
  const bottom = rect.y + rect.height - epsilon;

  if (segment.x1 === segment.x2) {
    const start = Math.min(segment.y1, segment.y2);
    const end = Math.max(segment.y1, segment.y2);
    return (
      segment.x1 > left &&
      segment.x1 < right &&
      Math.max(start, top) < Math.min(end, bottom)
    );
  }

  const start = Math.min(segment.x1, segment.x2);
  const end = Math.max(segment.x1, segment.x2);
  return (
    segment.y1 > top &&
    segment.y1 < bottom &&
    Math.max(start, left) < Math.min(end, right)
  );
}

const collisions = [];
const longInteriorRoutes = [];

for (const path of connectorPaths) {
  for (const segment of segmentsFromPath(path)) {
    for (const rect of nodeRects) {
      if (crossesRectInterior(segment, rect)) {
        collisions.push(`${path} crosses ${JSON.stringify(rect)}`);
      }
    }

    const verticalLength = Math.abs(segment.y2 - segment.y1);
    if (
      segment.x1 === segment.x2 &&
      verticalLength > 1000 &&
      segment.x1 > 55 &&
      segment.x1 < 1645
    ) {
      longInteriorRoutes.push(
        `${path} has ${verticalLength}px trunk at x=${segment.x1}`,
      );
    }
  }
}

assert(
  collisions.length === 0,
  `Connectors cross node interiors:\n${collisions.join("\n")}`,
);
assert(
  longInteriorRoutes.length === 0,
  `Cross-flow routes must use an outer gutter:\n${longInteriorRoutes.join("\n")}`,
);

console.log("AI companion flow verification passed.");
