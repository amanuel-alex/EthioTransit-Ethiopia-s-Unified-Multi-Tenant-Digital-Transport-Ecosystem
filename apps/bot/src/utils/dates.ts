/** Start/end of calendar day in UTC for API `from` / `to` query params. */
export function dayBoundsUtc(yyyyMmDd: string): { from: string; to: string } {
  const [y, m, d] = yyyyMmDd.split("-").map((x) => parseInt(x, 10));
  if (!y || !m || !d) {
    const now = new Date();
    const iso = now.toISOString().slice(0, 10);
    return dayBoundsUtc(iso);
  }
  const from = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
  const to = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));
  return { from: from.toISOString(), to: to.toISOString() };
}

export function addDaysYmd(yyyyMmDd: string, days: number): string {
  const [y, m, d] = yyyyMmDd.split("-").map((x) => parseInt(x, 10));
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

export function todayUtcYmd(): string {
  return new Date().toISOString().slice(0, 10);
}

export function formatEtLabel(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-ET", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Africa/Addis_Ababa",
    });
  } catch {
    return iso;
  }
}
