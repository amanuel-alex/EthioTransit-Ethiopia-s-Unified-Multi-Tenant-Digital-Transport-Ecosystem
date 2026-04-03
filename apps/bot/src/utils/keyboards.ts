import { Markup } from "telegraf";
import type { BotLocale } from "../types/session.js";
import type { CityItem, PopularRouteItem, RouteSearchHit, ScheduleHit } from "../types/session.js";
import { tr } from "../i18n/index.js";
import { formatEtLabel } from "./dates.js";

const MAX_ROW = 2;

export function languagePickerKeyboard() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback("🇬🇧 English", "lang:en"),
      Markup.button.callback("🇪🇹 አማርኛ", "lang:am"),
    ],
    [Markup.button.callback("Afaan Oromoo", "lang:om")],
  ]);
}

export function mainMenuKeyboard(locale: BotLocale) {
  return Markup.inlineKeyboard([
    [Markup.button.callback(tr(locale, "btn_search"), "m:s")],
    [Markup.button.callback(tr(locale, "btn_bookings"), "m:b")],
    [
      Markup.button.callback(tr(locale, "btn_login"), "m:l"),
      Markup.button.callback(tr(locale, "btn_language"), "m:g"),
    ],
  ]);
}

export function paymentKeyboard(locale: BotLocale) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(tr(locale, "btn_mpesa"), "py:m"),
      Markup.button.callback(tr(locale, "btn_chapa"), "py:c"),
    ],
    [Markup.button.callback(tr(locale, "skipPaid"), "py:x")],
  ]);
}

export function popularRoutesKeyboard(locale: BotLocale, routes: PopularRouteItem[]) {
  const rows: ReturnType<typeof Markup.button.callback>[][] = [];
  for (let i = 0; i < routes.length; i += MAX_ROW) {
    const chunk = routes.slice(i, i + MAX_ROW);
    rows.push(
      chunk.map((r, j) => {
        const idx = i + j;
        const label = `${r.origin.slice(0, 12)}→${r.destination.slice(0, 10)}`;
        return Markup.button.callback(label, `pr:${idx}`);
      }),
    );
  }
  rows.push([Markup.button.callback(tr(locale, "btn_pick_cities"), "pr:x")]);
  return Markup.inlineKeyboard(rows);
}

export function citiesKeyboard(
  locale: BotLocale,
  cities: CityItem[],
  prefix: "o" | "d",
  page: number,
) {
  const pageSize = 6;
  const start = page * pageSize;
  const slice = cities.slice(start, start + pageSize);
  const rows: ReturnType<typeof Markup.button.callback>[][] = [];
  for (let i = 0; i < slice.length; i += 2) {
    rows.push(
      slice.slice(i, i + 2).map((c) => Markup.button.callback(c.name, `${prefix}:${c.id}`)),
    );
  }
  const nav: ReturnType<typeof Markup.button.callback>[] = [];
  if (page > 0) nav.push(Markup.button.callback("⬅️", `${prefix}p:${page - 1}`));
  if (start + pageSize < cities.length) {
    nav.push(Markup.button.callback("➡️", `${prefix}p:${page + 1}`));
  }
  if (nav.length) rows.push(nav);
  return Markup.inlineKeyboard(rows);
}

const DAY_KEYS = [
  "btn_today",
  "btn_tomorrow",
  "btn_plus2",
  "btn_plus3",
  "btn_plus4",
  "btn_plus5",
  "btn_plus6",
] as const;

export function travelDateKeyboard(locale: BotLocale) {
  const rows: ReturnType<typeof Markup.button.callback>[][] = [];
  for (let i = 0; i < DAY_KEYS.length; i += 3) {
    rows.push(
      DAY_KEYS.slice(i, i + 3).map((key, j) => {
        const off = i + j;
        return Markup.button.callback(tr(locale, key), `dt:${off}`);
      }),
    );
  }
  return Markup.inlineKeyboard(rows);
}

export function routesKeyboard(routes: RouteSearchHit[]) {
  const rows: ReturnType<typeof Markup.button.callback>[][] = [];
  const cap = Math.min(routes.length, 12);
  for (let i = 0; i < cap; i += 1) {
    const r = routes[i]!;
    const label = `${r.company.name.slice(0, 18)} · ${r.origin.slice(0, 8)}→${r.destination.slice(0, 8)}`;
    rows.push([Markup.button.callback(label, `rt:${r.id}`)]);
  }
  return Markup.inlineKeyboard(rows);
}

export function schedulesKeyboard(schedules: ScheduleHit[]) {
  const rows: ReturnType<typeof Markup.button.callback>[][] = [];
  const cap = Math.min(schedules.length, 15);
  for (let i = 0; i < cap; i++) {
    const sch = schedules[i]!;
    const t = formatEtLabel(sch.schedule.departsAt);
    const seats = sch.availableSeats.length;
    const label = `${t} · ${sch.schedule.basePrice} ETB · ${seats} seats`;
    rows.push([Markup.button.callback(label, `sc:${sch.schedule.id}`)]);
  }
  return Markup.inlineKeyboard(rows);
}

export function seatKeyboard(
  locale: BotLocale,
  available: number[],
  selected: Set<number>,
  page: number,
) {
  const pageSize = 12;
  const start = page * pageSize;
  const slice = available.slice(start, start + pageSize);
  const rows: ReturnType<typeof Markup.button.callback>[][] = [];
  for (let i = 0; i < slice.length; i += 4) {
    rows.push(
      slice.slice(i, i + 4).map((n) => {
        const on = selected.has(n);
        return Markup.button.callback(on ? `✓ ${n}` : `${n}`, `st:${n}`);
      }),
    );
  }
  const nav: ReturnType<typeof Markup.button.callback>[] = [];
  if (page > 0) nav.push(Markup.button.callback("⬅️", `stp:${page - 1}`));
  if (start + pageSize < available.length) {
    nav.push(Markup.button.callback("➡️", `stp:${page + 1}`));
  }
  if (nav.length) rows.push(nav);
  rows.push([
    Markup.button.callback(tr(locale, "btn_book_seats"), "cf:book"),
    Markup.button.callback(tr(locale, "btn_cancel"), "cf:ca"),
  ]);
  return Markup.inlineKeyboard(rows);
}
