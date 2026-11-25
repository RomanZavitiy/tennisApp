import type { Sport } from "@/lib/generated/prisma/enums";

// Which pin a club gets on the map (slice PD5, task PD5.2): the tennis pin,
// the padel pin, or the split pin for a club with both — so a tennis player
// sees at a glance that a club also has padel, and the other way round.
// Kept apart from marker-icon.ts, which imports Leaflet and so can't load
// outside the browser (the unit test imports this one).
export type MarkerKind = "tennis" | "padel" | "both";

export function markerKindFor(sports: readonly Sport[]): MarkerKind {
  const tennis = sports.includes("TENNIS");
  const padel = sports.includes("PADEL");
  if (tennis && padel) return "both";
  return padel ? "padel" : "tennis";
}
