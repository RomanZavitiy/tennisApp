import { describe, expect, it } from "vitest";

import { canCancelOffer } from "@/lib/offers/cancel-rules";

const NOW = new Date("2026-10-11T10:00:00Z");
const LATER = new Date("2026-10-20T16:00:00Z");

describe("canCancelOffer", () => {
  it.each(["OPEN", "FULL"] as const)(
    "cancels an upcoming %s offer",
    (status) => {
      expect(canCancelOffer({ status, startsAt: LATER }, NOW)).toBe(true);
    },
  );

  it("won't cancel an offer twice", () => {
    expect(canCancelOffer({ status: "CANCELLED", startsAt: LATER }, NOW)).toBe(
      false,
    );
  });

  it("won't cancel an offer that has started", () => {
    expect(canCancelOffer({ status: "OPEN", startsAt: NOW }, NOW)).toBe(false);
    expect(
      canCancelOffer({ status: "FULL", startsAt: new Date("2026-10-01") }, NOW),
    ).toBe(false);
  });
});
