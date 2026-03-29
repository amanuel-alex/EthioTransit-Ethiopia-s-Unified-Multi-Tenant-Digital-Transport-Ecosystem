/** Local calendar day → UTC ISO range for schedule queries. */
export function localDayRangeToIso(dateYmd: string) {
  const from = new Date(`${dateYmd}T00:00:00`);
  const to = new Date(`${dateYmd}T23:59:59.999`);
  return { from: from.toISOString(), to: to.toISOString() };
}
