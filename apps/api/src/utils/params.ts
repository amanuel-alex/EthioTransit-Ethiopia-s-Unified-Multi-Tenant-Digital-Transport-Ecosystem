/** Normalize Express route params (string | string[]) to a single string. */
export function routeParam(
  value: string | string[] | undefined,
): string | undefined {
  if (value === undefined) return undefined;
  return Array.isArray(value) ? value[0] : value;
}
