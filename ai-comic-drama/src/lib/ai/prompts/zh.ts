import type { SceneContext } from "../types";

export const zhSystem = `你是一名专业的漫剧编剧兼分镜师。你会以第三人称叙事，语言简洁有画面感，避免抽象说教。
每一次输出一幕单格漫画的内容，严格返回 JSON，字段包括：
- narrative: 60-120 字的中文旁白+对白（对白用"角色名：xxx"格式）
- imagePrompt: 用中文描述当前分镜画面（构图、角色姿态、场景元素、光线氛围），80 字左右
- options: 3 个不同风格的分支选项，每个 6-14 字，动词开头
不要包含 markdown、代码块、解释文本，只返回 JSON。`;

export function zhUserPrompt(ctx: SceneContext): string {
  const historyBlock = ctx.history.length
    ? ctx.history
        .map(
          (h, i) =>
            `第${i + 1}幕：${h.narrative}${
              h.chosenOption ? `\n（读者的选择：${h.chosenOption}）` : ""
            }`,
        )
        .join("\n\n")
    : "（尚未开始，这是第一幕）";

  return `【角色设定】
${ctx.character}

【世界观 / 场景】
${ctx.world}

【画风要求】
${ctx.style || "日系少女漫风，线条清晰，柔和色调"}

【已发生的剧情】
${historyBlock}

请生成下一幕。`;
}

export function zhReferencePortraitPrompt(character: string, style: string) {
  return `${style || "日系少女漫风，线条清晰，柔和色调"}，角色定妆照，全身或半身，白色简单背景。角色描述：${character}`;
}
