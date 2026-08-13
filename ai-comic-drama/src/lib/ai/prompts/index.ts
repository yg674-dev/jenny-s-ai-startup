import type { Locale } from "@/lib/i18n/config";
import type { SceneContext } from "../types";
import { enReferencePortraitPrompt, enSystem, enUserPrompt } from "./en";
import { zhReferencePortraitPrompt, zhSystem, zhUserPrompt } from "./zh";

export function buildScenePrompts(locale: Locale, ctx: SceneContext) {
  return locale === "en"
    ? { system: enSystem, user: enUserPrompt(ctx) }
    : { system: zhSystem, user: zhUserPrompt(ctx) };
}

export function buildReferencePortraitPrompt(
  locale: Locale,
  character: string,
  style: string,
) {
  return locale === "en"
    ? enReferencePortraitPrompt(character, style)
    : zhReferencePortraitPrompt(character, style);
}
