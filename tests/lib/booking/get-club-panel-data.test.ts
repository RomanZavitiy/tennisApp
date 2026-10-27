import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  blockForSlot,
  bookingForSlot,
  getClubPanelDay,
  getPendingQueue,
  type NamedBlock,
  type NamedBooking,
} from "@/lib/booking/get-club-panel-data";

const { findFirst, bookingFindMany, blockFindMany } = vi.hoisted(() => ({
  findFirst: vi.fn(),
  bookingFindMany: vi.fn(),
  blockFindMany: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    club: { findFirst },
    booking: { findMany: bookingFindMany },
    courtBlock: { findMany: blockFindMany },
  },
}));

const CLUB_ID = "11111111-1111-4111-8111-111111111111";
const COURT_ID = "a1111111-1111-4111-8111-111111111111";
const TUESDAY = "2026-10-20";

const CLUB_ROW = {
  courts: [{ id: COURT_ID, name: "Court 1" }],
  courtHours: [{ weekday: 2, opensAt: 0, closesAt: 1440 }],
};

beforeEach(() => {
  findFirst.mockReset();
  bookingFindMany.mockReset().mockResolvedValue([]);
  blockFindMany.mockReset().mockResolvedValue([]);
});

describe("getClubPanelDay", () => {
  it("returns null when the club isn't SPINBUDDY (or doesn't exist)", async () => {
    findFirst.mockResolvedValue(null);

    expect(await getClubPanelDay(CLUB_ID, TUESDAY)).toBeNull();
  });

  it("labels a taken slot with the booker's first name and last initial", async () => {
    findFirst.mockResolvedValue(CLUB_ROW);
    bookingFindMany.mockResolvedValue([
      {
        id: "booking-1",
        courtId: COURT_ID,
        startsAt: new Date("2026-10-20T16:00:00Z"), // 18:00 Kraków
        endsAt: new Date("2026-10-20T17:00:00Z"),
        status: "CONFIRMED",
        user: { name: "Anna Kowalska" },
      },
    ]);

    const result = await getClubPanelDay(
      CLUB_ID,
      TUESDAY,
      new Date("2026-01-01T00:00:00Z"),
    );

    expect(result?.bookings).toEqual([
      {
        id: "booking-1",
        courtId: COURT_ID,
        startsAt: new Date("2026-10-20T16:00:00Z"),
        endsAt: new Date("2026-10-20T17:00:00Z"),
        status: "CONFIRMED",
        player: "Anna K.",
      },
    ]);
    const court = result?.grid.find((c) => c.courtId === COURT_ID);
    expect(
      court?.slots.find(
        (s) => s.start.toISOString() === "2026-10-20T16:00:00.000Z",
      )?.status,
    ).toBe("TAKEN");
  });

  it("includes blocks (with their id and reason) for removal by staff", async () => {
    findFirst.mockResolvedValue(CLUB_ROW);
    blockFindMany.mockResolvedValue([
      {
        id: "block-1",
        courtId: COURT_ID,
        startsAt: new Date("2026-10-20T16:00:00Z"),
        endsAt: new Date("2026-10-20T17:00:00Z"),
        reason: "Maintenance",
      },
    ]);

    const result = await getClubPanelDay(
      CLUB_ID,
      TUESDAY,
      new Date("2026-01-01T00:00:00Z"),
    );

    expect(result?.blocks).toEqual([
      {
        id: "block-1",
        courtId: COURT_ID,
        startsAt: new Date("2026-10-20T16:00:00Z"),
        endsAt: new Date("2026-10-20T17:00:00Z"),
        reason: "Maintenance",
      },
    ]);
  });
});

describe("getPendingQueue", () => {
  it("orders by start time and names each booking's player", async () => {
    bookingFindMany.mockResolvedValue([
      {
        id: "booking-1",
        startsAt: new Date("2026-10-20T16:00:00Z"),
        endsAt: new Date("2026-10-20T17:00:00Z"),
        note: "Please confirm early",
        court: { name: "Court 1" },
        user: { name: "Jan Nowak" },
      },
    ]);

    const result = await getPendingQueue(CLUB_ID);

    expect(result).toEqual([
      {
        id: "booking-1",
        courtName: "Court 1",
        startsAt: new Date("2026-10-20T16:00:00Z"),
        endsAt: new Date("2026-10-20T17:00:00Z"),
        note: "Please confirm early",
        player: "Jan N.",
      },
    ]);
    expect(bookingFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: "PENDING", court: { clubId: CLUB_ID } },
        orderBy: { startsAt: "asc" },
      }),
    );
  });
});

describe("bookingForSlot / blockForSlot", () => {
  const booking: NamedBooking = {
    id: "booking-1",
    courtId: COURT_ID,
    startsAt: new Date("2026-10-20T16:00:00Z"),
    endsAt: new Date("2026-10-20T17:00:00Z"),
    status: "CONFIRMED",
    player: "Anna K.",
  };
  const block: NamedBlock = {
    id: "block-1",
    courtId: COURT_ID,
    startsAt: new Date("2026-10-20T17:00:00Z"),
    endsAt: new Date("2026-10-20T18:00:00Z"),
    reason: null,
  };

  it("finds the booking covering a slot", () => {
    expect(
      bookingForSlot([booking], COURT_ID, new Date("2026-10-20T16:30:00Z")),
    ).toEqual(booking);
  });

  it("returns null outside the booking's range", () => {
    expect(
      bookingForSlot([booking], COURT_ID, new Date("2026-10-20T17:00:00Z")),
    ).toBeNull();
  });

  it("finds the block covering a slot, on the right court only", () => {
    expect(
      blockForSlot([block], COURT_ID, new Date("2026-10-20T17:30:00Z")),
    ).toEqual(block);
    expect(
      blockForSlot([block], "other-court", new Date("2026-10-20T17:30:00Z")),
    ).toBeNull();
  });
});
