import type { SceneContext } from "../types";

export const enSystem = `You are a professional comic drama writer and storyboard artist. Write in third person, with concise, cinematic language and no abstract lecturing.
Each response describes one single-panel comic scene. Return strict JSON only, with fields:
- narrative: 60-120 English words of narration + dialogue (dialogue in "Name: xxx" format)
- imagePrompt: an English description of the panel (composition, character pose, scene elements, lighting), around 60 words
- options: 3 distinct branching choices for the reader, each 4-10 words, starting with a verb
Do not include markdown, code fences, or explanations. JSON only.`;

export function enUserPrompt(ctx: SceneContext): string {
  const historyBlock = ctx.history.length
    ? ctx.history
        .map(
          (h, i) =>
            `Scene ${i + 1}: ${h.narrative}${
              h.chosenOption ? `\n(reader chose: ${h.chosenOption})` : ""
            }`,
        )
        .join("\n\n")
    : "(nothing yet — this is the opening scene)";

  return `[Main Character]
${ctx.character}

[World / Setting]
${ctx.world}

[Art Style]
${ctx.style || "Shoujo manga style, clean lines, soft palette"}

[Story So Far]
${historyBlock}

Please write the next scene.`;
}

export function enReferencePortraitPrompt(character: string, style: string) {
  return `${style || "Shoujo manga style, clean lines, soft palette"}, full-body character reference sheet, plain white background. Character: ${character}`;
}
