import type { Node, Script } from "@/lib/db/schema";
import type { Locale } from "./config";

/** Pick locale-appropriate field, fallback to Chinese if EN is missing/empty. */
function pick(zh: string | null | undefined, en: string | null | undefined, locale: Locale): string {
  if (locale === "en") return (en && en.trim()) || zh || "";
  return zh || "";
}

export function localizeScript(script: Script, locale: Locale) {
  return {
    ...script,
    title: pick(script.title, script.titleEn, locale),
    characterSetup: pick(script.characterSetup, script.characterSetupEn, locale),
    worldSetup: pick(script.worldSetup, script.worldSetupEn, locale),
    stylePrompt: pick(script.stylePrompt, script.stylePromptEn, locale),
  };
}

export function localizeNode(node: Node, locale: Locale) {
  const chosen =
    locale === "en"
      ? node.chosenOptionTextEn?.trim() || node.chosenOptionText
      : node.chosenOptionText;
  const narrative = pick(node.narrative, node.narrativeEn, locale);
  const options =
    locale === "en" && node.optionsEn && node.optionsEn.length
      ? node.optionsEn
      : node.options;
  return {
    ...node,
    chosenOptionText: chosen,
    narrative,
    options,
  };
}

export function hasEnglish(
  target: Script | Node,
): boolean {
  if ("title" in target) {
    return !!(target as Script).titleEn?.trim();
  }
  return !!(target as Node).narrativeEn?.trim();
}
