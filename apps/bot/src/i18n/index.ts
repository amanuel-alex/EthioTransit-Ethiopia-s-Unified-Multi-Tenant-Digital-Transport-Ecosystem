import type { BotLocale } from "../types/session.js";
import { DICTS, LOCALE_LABELS } from "./dict.js";

export { DICTS, LOCALE_LABELS };

export function tr(
  locale: BotLocale,
  key: string,
  vars?: Record<string, string | number>,
): string {
  const table = DICTS[locale] ?? DICTS.en;
  const fallback = DICTS.en;
  let s = table[key] ?? fallback[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.replaceAll(`{${k}}`, String(v));
    }
  }
  return s;
}

export function localeLabel(locale: BotLocale): string {
  return LOCALE_LABELS[locale];
}
