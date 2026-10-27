import { describe, expect, it } from "vitest";

import {
  buildDayGrid,
  canFit,
  type BookingInput,
  type CourtBlockInput,
  type CourtHoursInput,
} from "@/lib/booking/availability";

const COURT_A = "a1111111-1111-4111-8111-111111111111";
const COURT_B = "b2222222-2222-4222-8222-222222222222";

// 2026-10-20 is a Tuesday (weekday 2) — same reference date krakow-time's
// own tests use ("Tue, Oct 20"), still CEST (UTC+2): Poland's DST doesn't
// end until 25 Oct 2026.
const TUESDAY = "2026-10-20";
const TUESDAY_WEEKDAY = 2;
const FAR_PAST = new Date("2026-01-01T00:00:00Z");

function slotAt(
  grid: ReturnType<typeof buildDayGrid>,
  courtId: string,
  isoLocal: string,
) {
  const court = grid.find((c) => c.courtId === courtId);
  return court?.slots.find((s) => s.start.toISOString() === isoLocal);
}

describe("buildDayGrid", () => {
  it("marks every slot CLOSED on a weekday with no hours row", () => {
    const hours: CourtHoursInput[] = [
      { weekday: 1, opensAt: 480, closesAt: 1200 }, // Monday only
    ];
    const [grid] = buildDayGrid({
      date: TUESDAY,
      hours,
      courts: [{ id: COURT_A }],
      bookings: [],
      blocks: [],
      now: FAR_PAST,
    });
    expect(grid.slots.length).toBeGreaterThan(0);
    expect(grid.slots.every((s) => s.status === "CLOSED")).toBe(true);
  });

  it("opens exactly [opensAt, closesAt): 18:00 and 18:30 are open, 19:00 isn't", () => {
    const hours: CourtHoursInput[] = [
      { weekday: TUESDAY_WEEKDAY, opensAt: 1080, closesAt: 1140 }, // 18:00-19:00
    ];
    const grid = buildDayGrid({
      date: TUESDAY,
      hours,
      courts: [{ id: COURT_A }],
      bookings: [],
      blocks: [],
      now: FAR_PAST,
    });
    // 18:00 Kraków (CEST, UTC+2) = 16:00 UTC.
    expect(slotAt(grid, COURT_A, "2026-10-20T16:00:00.000Z")?.status).toBe(
      "FREE",
    );
    expect(slotAt(grid, COURT_A, "2026-10-20T16:30:00.000Z")?.status).toBe(
      "FREE",
    );
    // 19:00 would start a slot ending at 19:30, past closesAt.
    expect(slotAt(grid, COURT_A, "2026-10-20T17:00:00.000Z")?.status).toBe(
      "CLOSED",
    );
  });

  it("marks a slot PAST once its start has passed, not after", () => {
    const hours: CourtHoursInput[] = [
      { weekday: TUESDAY_WEEKDAY, opensAt: 0, closesAt: 1440 },
    ];
    // "now" is exactly 12:00 in Kraków.
    const now = new Date("2026-10-20T10:00:00Z");
    const grid = buildDayGrid({
      date: TUESDAY,
      hours,
      courts: [{ id: COURT_A }],
      bookings: [],
      blocks: [],
      now,
    });
    expect(slotAt(grid, COURT_A, "2026-10-20T09:30:00.000Z")?.status).toBe(
      "PAST",
    ); // 11:30
    expect(slotAt(grid, COURT_A, "2026-10-20T10:00:00.000Z")?.status).toBe(
      "FREE",
    ); // 12:00, starts exactly at "now"
    expect(slotAt(grid, COURT_A, "2026-10-20T10:30:00.000Z")?.status).toBe(
      "FREE",
    ); // 12:30
  });

  it("marks a slot TAKEN for an overlapping booking, but not a declined one", () => {
    const hours: CourtHoursInput[] = [
      { weekday: TUESDAY_WEEKDAY, opensAt: 0, closesAt: 1440 },
    ];
    const bookings: BookingInput[] = [
      {
        courtId: COURT_A,
        startsAt: new Date("2026-10-20T16:00:00Z"), // 18:00
        endsAt: new Date("2026-10-20T17:00:00Z"), // 19:00
        status: "CONFIRMED",
      },
      {
        courtId: COURT_B,
        startsAt: new Date("2026-10-20T16:00:00Z"),
        endsAt: new Date("2026-10-20T17:00:00Z"),
        status: "DECLINED",
      },
    ];
    const grid = buildDayGrid({
      date: TUESDAY,
      hours,
      courts: [{ id: COURT_A }, { id: COURT_B }],
      bookings,
      blocks: [],
      now: FAR_PAST,
    });
    expect(slotAt(grid, COURT_A, "2026-10-20T16:00:00.000Z")?.status).toBe(
      "TAKEN",
    );
    expect(slotAt(grid, COURT_A, "2026-10-20T16:30:00.000Z")?.status).toBe(
      "TAKEN",
    );
    // Adjacent, not overlapping.
    expect(slotAt(grid, COURT_A, "2026-10-20T17:00:00.000Z")?.status).toBe(
      "FREE",
    );
    // A declined booking never blocked the court.
    expect(slotAt(grid, COURT_B, "2026-10-20T16:00:00.000Z")?.status).toBe(
      "FREE",
    );
  });

  it("marks a slot TAKEN for a block, regardless of its status field", () => {
    const hours: CourtHoursInput[] = [
      { weekday: TUESDAY_WEEKDAY, opensAt: 0, closesAt: 1440 },
    ];
    const blocks: CourtBlockInput[] = [
      {
        courtId: COURT_A,
        startsAt: new Date("2026-10-20T16:00:00Z"),
        endsAt: new Date("2026-10-20T17:00:00Z"),
      },
    ];
    const grid = buildDayGrid({
      date: TUESDAY,
      hours,
      courts: [{ id: COURT_A }],
      bookings: [],
      blocks,
      now: FAR_PAST,
    });
    expect(slotAt(grid, COURT_A, "2026-10-20T16:30:00.000Z")?.status).toBe(
      "TAKEN",
    );
  });

  describe("DST transitions", () => {
    it("spring forward: skips the nonexistent hour but stays contiguous", () => {
      // Clocks go forward at 01:00 UTC on 2026-03-29 — 02:00-03:00 local
      // never happens. A club open all day has one fewer real hour.
      const hours: CourtHoursInput[] = [
        { weekday: 0, opensAt: 0, closesAt: 1440 }, // 2026-03-29 is a Sunday
      ];
      const grid = buildDayGrid({
        date: "2026-03-29",
        hours,
        courts: [{ id: COURT_A }],
        bookings: [],
        blocks: [],
        now: FAR_PAST,
      });
      const slots = grid[0].slots;
      // A normal day has 48 half-hour slots; this one is missing the two
      // whose label (02:00, 02:30) never occurs.
      expect(slots).toHaveLength(46);
      // What's left is still back-to-back, real time: 01:30 CET's slot ends
      // exactly when 03:00 CEST's begins.
      for (let i = 0; i < slots.length - 1; i++) {
        expect(slots[i].end.getTime()).toBe(slots[i + 1].start.getTime());
      }
    });

    it("fall back: resolves the repeated hour to its first pass, leaving a real gap", () => {
      // Clocks go back at 01:00 UTC on 2026-10-25 — 02:00-03:00 local
      // happens twice. krakowLocalToDate always reads the first (CEST)
      // pass (decision in lib/offers/krakow-time.ts), so the grid has the
      // usual 48 labelled slots, but the second pass isn't one of them: a
      // real one-hour gap sits between the 02:30 and 03:00 slots.
      const hours: CourtHoursInput[] = [
        { weekday: 0, opensAt: 0, closesAt: 1440 }, // 2026-10-25 is a Sunday
      ];
      const grid = buildDayGrid({
        date: "2026-10-25",
        hours,
        courts: [{ id: COURT_A }],
        bookings: [],
        blocks: [],
        now: FAR_PAST,
      });
      const slots = grid[0].slots;
      expect(slots).toHaveLength(48);

      const at0230 = slots.find(
        (s) => s.start.toISOString() === "2026-10-25T00:30:00.000Z",
      );
      const at0300 = slots.find(
        (s) => s.start.toISOString() === "2026-10-25T02:00:00.000Z",
      );
      // 02:30's slot ends at 01:00Z; 03:00's slot starts an hour later, at
      // 02:00Z — the swallowed second pass of 02:00-03:00 CET.
      expect(at0230?.end.toISOString()).toBe("2026-10-25T01:00:00.000Z");
      expect(at0300?.start.toISOString()).toBe("2026-10-25T02:00:00.000Z");
    });
  });
});

describe("canFit", () => {
  const hours: CourtHoursInput[] = [
    { weekday: TUESDAY_WEEKDAY, opensAt: 0, closesAt: 1440 },
  ];

  function grid(bookings: BookingInput[] = []) {
    return buildDayGrid({
      date: TUESDAY,
      hours,
      courts: [{ id: COURT_A }],
      bookings,
      blocks: [],
      now: FAR_PAST,
    });
  }

  it("fits a 90-minute booking across three free slots", () => {
    expect(canFit(grid(), COURT_A, new Date("2026-10-20T16:00:00Z"), 90)).toBe(
      true,
    );
  });

  it("doesn't fit when any of the three slots is taken", () => {
    const bookings: BookingInput[] = [
      {
        courtId: COURT_A,
        startsAt: new Date("2026-10-20T17:00:00Z"),
        endsAt: new Date("2026-10-20T17:30:00Z"),
        status: "PENDING",
      },
    ];
    expect(
      canFit(grid(bookings), COURT_A, new Date("2026-10-20T16:00:00Z"), 90),
    ).toBe(false);
  });

  it("doesn't fit an unknown court or a start that isn't a slot boundary", () => {
    expect(canFit(grid(), COURT_B, new Date("2026-10-20T16:00:00Z"), 90)).toBe(
      false,
    );
    expect(canFit(grid(), COURT_A, new Date("2026-10-20T16:10:00Z"), 90)).toBe(
      false,
    );
  });
});
