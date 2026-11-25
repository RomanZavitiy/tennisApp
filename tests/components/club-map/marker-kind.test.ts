import { describe, expect, it } from "vitest";

import { markerKindFor } from "@/components/club-map/marker-kind";

// The map pin for a club's sports (slice PD5, task PD5.2).
describe("markerKindFor", () => {
  it.each([
    [["TENNIS"], "tennis"],
    [["PADEL"], "padel"],
    [["TENNIS", "PADEL"], "both"],
    [["PADEL", "TENNIS"], "both"],
    // The column is never empty (CHECK), but a tennis pin is the safe fallback.
    [[], "tennis"],
  ] as const)("%j → %s", (sports, kind) => {
    expect(markerKindFor(sports)).toBe(kind);
  });
});
