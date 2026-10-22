import { describe, expect, it } from "vitest";

import { canCancelBooking } from "@/lib/booking/cancel-rules";

const NOW = new Date("2026-11-05T10:00:00Z");
const WELL_AHEAD = new Date("2026-11-05T23:00:00Z"); // 13h out
const JUST_INSIDE_WINDOW = new Date("2026-11-05T21:30:00Z"); // 11.5h out

describe("canCancelBooking", () => {
  it.each(["PENDING", "CONFIRMED"] as const)(
    "cancels a %s booking well ahead of its start",
    (status) => {
      expect(canCancelBooking({ status, startsAt: WELL_AHEAD }, NOW)).toBe(
        true,
      );
    },
  );

  it("won't cancel within the window right before the start", () => {
    expect(
      canCancelBooking(
        { status: "PENDING", startsAt: JUST_INSIDE_WINDOW },
        NOW,
      ),
    ).toBe(false);
  });

  it.each(["DECLINED", "CANCELLED"] as const)(
    "won't cancel a booking that's already %s",
    (status) => {
      expect(canCancelBooking({ status, startsAt: WELL_AHEAD }, NOW)).toBe(
        false,
      );
    },
  );
});
