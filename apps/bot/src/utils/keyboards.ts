import { Markup } from "telegraf";
import type { CityItem, PopularRouteItem, RouteSearchHit, ScheduleHit } from "../types/session.js";
import { formatEtLabel } from "./dates.js";

export function mainMenuKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback("🔍 Search bus", "m:s")],
    [Markup.button.callback("🎫 My bookings", "m:b")],
    [Markup.button.callback("🔐 Link / login", "m:l")],
  ]);
}

export function paymentKeyboard() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback("M-Pesa", "py:m"),
      Markup.button.callback("Chapa", "py:c"),
    ],
    [Markup.button.callback("⏭ Skip (already paid)", "py:x")],
  ]);
}

const MAX_ROW = 2;

export function popularRoutesKeyboard(routes: PopularRouteItem[]) {
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
  rows.push([Markup.button.callback("📍 Pick cities manually", "pr:x")]);
  return Markup.inlineKeyboard(rows);
}

export function citiesKeyboard(
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

export function travelDateKeyboard(ymdBase: string) {
  const labels = ["Today", "+1", "+2", "+3", "+4", "+5", "+6"];
  const rows: ReturnType<typeof Markup.button.callback>[][] = [];
  for (let i = 0; i < labels.length; i += 3) {
    rows.push(
      labels.slice(i, i + 3).map((lb, j) => {
        const off = i + j;
        return Markup.button.callback(lb, `dt:${off}`);
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
    const s = schedules[i]!;
    const t = formatEtLabel(s.schedule.departsAt);
    const seats = s.availableSeats.length;
    const label = `${t} · ${s.schedule.basePrice} ETB · ${seats} seats`;
    rows.push([Markup.button.callback(label, `sc:${s.schedule.id}`)]);
  }
  return Markup.inlineKeyboard(rows);
}

export function seatKeyboard(
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
    Markup.button.callback("✅ Book these seats", "cf:book"),
    Markup.button.callback("❌ Cancel", "cf:ca"),
  ]);
  return Markup.inlineKeyboard(rows);
}
