import { describe, expect, it } from "vitest";

import { isOfferDuration, offerEndsAt } from "@/lib/offers/duration";

describe("offer duration", () => {
  it("accepts only the offered lengths", () => {
    expect([60, 90, 120, 180].every(isOfferDuration)).toBe(true);
    expect(isOfferDuration(45)).toBe(false);
    expect(isOfferDuration(240)).toBe(false);
  });

  it("ends the given minutes after the start", () => {
    expect(
      offerEndsAt(new Date("2026-10-20T16:00:00Z"), 120).toISOString(),
    ).toBe("2026-10-20T18:00:00.000Z");
  });
});
