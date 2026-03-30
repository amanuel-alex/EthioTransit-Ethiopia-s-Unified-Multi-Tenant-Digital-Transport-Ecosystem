export type StationJson = {
  id: string;
  name: string;
  city?: { id: string; name: string; slug: string };
};

export type RouteWithStations = {
  origin: string;
  destination: string;
  originStation?: StationJson | null;
  destinationStation?: StationJson | null;
};

/** Primary line for cards: terminal names when available, else city labels. */
export function routeLineLabel(r: RouteWithStations): string {
  const o =
    r.originStation?.name != null
      ? `${r.originStation.name} · ${r.originStation.city?.name ?? r.origin}`
      : r.origin;
  const d =
    r.destinationStation?.name != null
      ? `${r.destinationStation.name} · ${r.destinationStation.city?.name ?? r.destination}`
      : r.destination;
  return `${o} → ${d}`;
}

/** Compact: station → station or city → city. */
export function routeShortLabel(r: RouteWithStations): string {
  const o = r.originStation?.name ?? r.origin;
  const d = r.destinationStation?.name ?? r.destination;
  return `${o} → ${d}`;
}
