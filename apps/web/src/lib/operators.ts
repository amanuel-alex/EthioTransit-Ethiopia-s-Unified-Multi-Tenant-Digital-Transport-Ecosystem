export type OperatorPreset = {
  id: string;
  name: string;
  slug?: string;
};

/**
 * Curated operators for passenger flows (API requires x-company-id).
 * Set NEXT_PUBLIC_OPERATORS_JSON to a JSON array after `pnpm db:seed`
 * (copy company id from Prisma Studio or seed output).
 */
export function getOperatorPresets(): OperatorPreset[] {
  const raw = process.env.NEXT_PUBLIC_OPERATORS_JSON;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (x): x is OperatorPreset =>
          typeof x === "object" &&
          x !== null &&
          typeof (x as OperatorPreset).id === "string" &&
          typeof (x as OperatorPreset).name === "string",
      )
      .map((x) => ({
        id: x.id,
        name: x.name,
        slug: x.slug,
      }));
  } catch {
    return [];
  }
}
