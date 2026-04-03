import type { BotLocale } from "../types/session.js";
import { tr } from "./index.js";

/** Rich home screen copy (HTML). */
export function welcomeMessage(locale: BotLocale): string {
  return [
    tr(locale, "welcomeTitle"),
    "",
    tr(locale, "welcomeSub"),
    "",
    tr(locale, "welcomeBody"),
    "",
    "━━━━━━━━━━━━━━━━",
    "",
    tr(locale, "chooseLanguageHint"),
  ].join("\n");
}
