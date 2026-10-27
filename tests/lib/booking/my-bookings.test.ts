import { beforeEach, describe, expect, it, vi } from "vitest";

import { getMyBookings } from "@/lib/booking/my-bookings";

const { findMany } = vi.hoisted(() => ({ findMany: vi.fn() }));
vi.mock("@/lib/db", () => ({
  db: { booking: { findMany } },
}));

const ME = "user-1";
const NOW = new Date("2026-10-27T10:00:00Z");

function booking(
  id: string,
  status: "PENDING" | "CONFIRMED" | "DECLINED" | "CANCELLED",
  startsAt: string,
  overrides: Partial<{
    offerId: string | null;
    declineReason: string | null;
  }> = {},
) {
  return {
    id,
    status,
    startsAt: new Date(startsAt),
    endsAt: new Date(new Date(startsAt).getTime() + 60 * 60_000),
    offerId: overrides.offerId ?? null,
    declineReason: overrides.declineReason ?? null,
    court: { name: "Court 1", club: { id: "club-1", name: "Fame Sport Club" } },
  };
}

describe("getMyBookings", () => {
  beforeEach(() => {
    findMany.mockReset().mockResolvedValue([]);
  });

  it("asks only for this player's bookings", async () => {
    await getMyBookings(ME, NOW);

    expect(findMany.mock.calls[0]?.[0]).toMatchObject({
      where: { userId: ME },
    });
  });

  it("splits into upcoming (soonest first) and past (most recent first)", async () => {
    findMany.mockResolvedValue([
      booking("far-future", "CONFIRMED", "2026-11-05T10:00:00Z"),
      booking("old", "CONFIRMED", "2026-10-01T10:00:00Z"),
      booking("near-future", "PENDING", "2026-10-28T10:00:00Z"),
      booking("recent-past", "CANCELLED", "2026-10-26T10:00:00Z"),
    ]);

    const { upcoming, past } = await getMyBookings(ME, NOW);

    expect(upcoming.map((b) => b.id)).toEqual(["near-future", "far-future"]);
    expect(past.map((b) => b.id)).toEqual(["recent-past", "old"]);
  });

  it("marks PENDING/CONFIRMED outside the cancel window as cancellable", async () => {
    findMany.mockResolvedValue([
      // 12h window: 2026-10-28T10:00 is exactly 24h out — cancellable.
      booking("cancellable", "PENDING", "2026-10-28T10:00:00Z"),
      // Inside the 12h window — not cancellable.
      booking("too-soon", "CONFIRMED", "2026-10-27T15:00:00Z"),
      // Already decided — never cancellable regardless of timing.
      booking("declined", "DECLINED", "2026-11-01T10:00:00Z"),
    ]);

    const { upcoming } = await getMyBookings(ME, NOW);
    const byId = Object.fromEntries(upcoming.map((b) => [b.id, b.canCancel]));

    expect(byId).toEqual({
      cancellable: true,
      "too-soon": false,
      declined: false,
    });
  });

  it("carries declineReason and offerId through", async () => {
    findMany.mockResolvedValue([
      booking("d1", "DECLINED", "2026-10-01T10:00:00Z", {
        declineReason: "Court under maintenance",
        offerId: "offer-1",
      }),
    ]);

    const { past } = await getMyBookings(ME, NOW);

    expect(past[0]).toMatchObject({
      declineReason: "Court under maintenance",
      offerId: "offer-1",
    });
  });
});
