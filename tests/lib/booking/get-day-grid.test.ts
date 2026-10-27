import { beforeEach, describe, expect, it, vi } from "vitest";

import { getDayGrid } from "@/lib/booking/get-day-grid";

const { findFirst, findBookings, findBlocks } = vi.hoisted(() => ({
  findFirst: vi.fn(),
  findBookings: vi.fn(),
  findBlocks: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    club: { findFirst },
    booking: { findMany: findBookings },
    courtBlock: { findMany: findBlocks },
  },
}));

const CLUB_ID = "11111111-1111-4111-8111-111111111111";
const COURT_ID = "a1111111-1111-4111-8111-111111111111";
// 2026-10-20 is a Tuesday (weekday 2), still CEST — same reference date
// lib/booking/availability.test.ts uses.
const TUESDAY = "2026-10-20";

const CLUB_ROW = {
  id: CLUB_ID,
  name: "KKS Olsza",
  courts: [
    {
      id: COURT_ID,
      name: "Court 1",
      surface: "CLAY",
      indoor: false,
      pricePerHourPln: 80,
    },
  ],
  courtHours: [{ weekday: 2, opensAt: 0, closesAt: 1440 }],
};

beforeEach(() => {
  findFirst.mockReset();
  findBookings.mockReset().mockResolvedValue([]);
  findBlocks.mockReset().mockResolvedValue([]);
});

describe("getDayGrid", () => {
  it("returns null for a non-UUID club id, without asking the database", async () => {
    expect(await getDayGrid("not-a-uuid", TUESDAY)).toBeNull();
    expect(findFirst).not.toHaveBeenCalled();
  });

  it("returns null when the club isn't found (missing, or not SPINBUDDY)", async () => {
    findFirst.mockResolvedValue(null);

    expect(await getDayGrid(CLUB_ID, TUESDAY)).toBeNull();
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: CLUB_ID, bookingMode: "SPINBUDDY" },
      }),
    );
  });

  it("builds a grid from the club's courts, hours, bookings and blocks", async () => {
    findFirst.mockResolvedValue(CLUB_ROW);
    findBookings.mockResolvedValue([
      {
        courtId: COURT_ID,
        startsAt: new Date("2026-10-20T16:00:00Z"), // 18:00 Kraków
        endsAt: new Date("2026-10-20T17:00:00Z"),
        status: "CONFIRMED",
      },
    ]);

    const result = await getDayGrid(
      CLUB_ID,
      TUESDAY,
      new Date("2026-01-01T00:00:00Z"),
    );

    expect(result?.club).toEqual({ id: CLUB_ID, name: "KKS Olsza" });
    expect(result?.courts).toEqual(CLUB_ROW.courts);
    const [court] = result?.grid ?? [];
    expect(court.courtId).toBe(COURT_ID);
    expect(
      court.slots.find(
        (s) => s.start.toISOString() === "2026-10-20T16:00:00.000Z",
      )?.status,
    ).toBe("TAKEN");
    expect(
      court.slots.find(
        (s) => s.start.toISOString() === "2026-10-20T15:30:00.000Z",
      )?.status,
    ).toBe("FREE");
  });

  it("only asks the database for that club's own day window", async () => {
    findFirst.mockResolvedValue(CLUB_ROW);

    await getDayGrid(CLUB_ID, TUESDAY, new Date("2026-01-01T00:00:00Z"));

    expect(findBookings).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          courtId: { in: [COURT_ID] },
          status: { in: ["PENDING", "CONFIRMED"] },
          // Kraków is CEST (UTC+2) in October; midnight local is 22:00 UTC.
          startsAt: { lt: new Date("2026-10-20T22:00:00.000Z") },
          endsAt: { gt: new Date("2026-10-19T22:00:00.000Z") },
        },
      }),
    );
  });
});
