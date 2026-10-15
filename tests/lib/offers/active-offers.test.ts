import { describe, expect, it } from "vitest";

import {
  activeOffersWhere,
  MAX_ACTIVE_OFFERS,
} from "@/lib/offers/active-offers";

describe("activeOffersWhere", () => {
  it("counts only this author's not-yet-started OPEN or FULL offers", () => {
    const now = new Date("2026-10-15T10:00:00Z");
    expect(activeOffersWhere("author-1", now)).toEqual({
      authorId: "author-1",
      status: { in: ["OPEN", "FULL"] },
      startsAt: { gt: now },
    });
  });
});

describe("MAX_ACTIVE_OFFERS", () => {
  it("matches the decided limit", () => {
    expect(MAX_ACTIVE_OFFERS).toBe(5);
  });
});
