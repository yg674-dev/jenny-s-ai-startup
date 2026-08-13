import type { Locale } from "@/lib/i18n/config";
import { ark, MODELS } from "./client";
import { buildScenePrompts } from "./prompts";
import type { SceneContext, SceneOutput } from "./types";

export async function generateScene(
  locale: Locale,
  ctx: SceneContext,
): Promise<SceneOutput> {
  const { system, user } = buildScenePrompts(locale, ctx);

  const resp = await ark.chat.completions.create({
    model: MODELS.llm,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.9,
    max_tokens: 3000,
    response_format: { type: "json_object" },
  });

  const finishReason = resp.choices[0]?.finish_reason;
  if (finishReason === "length") {
    throw new Error("LLM 输出被截断，请重试（可能网络波动或模型输出过长）");
  }

  const raw = resp.choices[0]?.message?.content ?? "{}";
  const parsed = safeParse(raw);

  const narrative = String(parsed.narrative ?? "").trim();
  const imagePrompt = String(parsed.imagePrompt ?? "").trim();
  const options = Array.isArray(parsed.options)
    ? parsed.options.map((o) => String(o).trim()).filter(Boolean).slice(0, 4)
    : [];

  if (!narrative || options.length < 2) {
    console.error("[LLM] malformed output:", raw);
    throw new Error("剧情格式解析失败，请重试");
  }

  return { narrative, imagePrompt, options };
}

function safeParse(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return {};
      }
    }
    return {};
  }
}
