export function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

export function toIsoTimestamp(date = new Date()): string {
  return date.toISOString();
}
