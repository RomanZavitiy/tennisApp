import { describe, expect, it } from "vitest";

import { buildDayGrid, type CourtHoursInput } from "@/lib/booking/availability";
import { runs, visibleRange } from "@/lib/booking/grid-layout";

const COURT_A = "a1111111-1111-4111-8111-111111111111";
const COURT_B = "b2222222-2222-4222-8222-222222222222";

// Same reference date as availability.test.ts: still CEST, DST doesn't end
// until 25 Oct 2026.
const TUESDAY = "2026-10-20";
const TUESDAY_WEEKDAY = 2;
const FAR_PAST = new Date("2026-01-01T00:00:00Z");

describe("visibleRange", () => {
  it("finds the first and last open slot, trimming the all-CLOSED edges", () => {
    const hours: CourtHoursInput[] = [
      { weekday: TUESDAY_WEEKDAY, opensAt: 480, closesAt: 1320 }, // 08:00-22:00
    ];
    const grid = buildDayGrid({
      date: TUESDAY,
      hours,
      courts: [{ id: COURT_A }],
      bookings: [],
      blocks: [],
      now: FAR_PAST,
    });
    const range = visibleRange(grid);
    if (range === null) throw new Error("expected a visible range");
    const slots = grid[0].slots;
    expect(slots[range.startIndex].status).not.toBe("CLOSED");
    expect(slots[range.endIndex].status).not.toBe("CLOSED");
    // Index just before/after the range is CLOSED (08:00 opens at index 16,
    // closes before index 44 — i.e. 21:30 is the last open half-hour).
    expect(slots[range.startIndex - 1]?.status).toBe("CLOSED");
    expect(slots[range.endIndex + 1]?.status).toBe("CLOSED");
  });

  it("returns null when every court is CLOSED all day", () => {
    const hours: CourtHoursInput[] = [
      { weekday: 1, opensAt: 480, closesAt: 1200 }, // Monday only
    ];
    const grid = buildDayGrid({
      date: TUESDAY, // weekday 2 — no hours row
      hours,
      courts: [{ id: COURT_A }, { id: COURT_B }],
      bookings: [],
      blocks: [],
      now: FAR_PAST,
    });
    expect(visibleRange(grid)).toBeNull();
  });

  it("counts a slot open if any court has it open", () => {
    const hours: CourtHoursInput[] = [
      { weekday: TUESDAY_WEEKDAY, opensAt: 480, closesAt: 540 }, // 08:00-09:00
    ];
    const gridA = buildDayGrid({
      date: TUESDAY,
      hours,
      courts: [{ id: COURT_A }],
      bookings: [],
      blocks: [],
      now: FAR_PAST,
    })[0];
    // Court B is CLOSED all day (no hours row for it conceptually — here we
    // simulate by building its own grid with no matching hours).
    const gridB = buildDayGrid({
      date: TUESDAY,
      hours: [],
      courts: [{ id: COURT_B }],
      bookings: [],
      blocks: [],
      now: FAR_PAST,
    })[0];
    const range = visibleRange([
      { ...gridA, courtId: COURT_A },
      { ...gridB, courtId: COURT_B },
    ]);
    expect(range).not.toBeNull();
  });

  describe("DST days", () => {
    it("spring forward (23h day, 46 slots): visible range still lands on real open slots", () => {
      const hours: CourtHoursInput[] = [
        { weekday: 0, opensAt: 480, closesAt: 1320 }, // 2026-03-29 is a Sunday, 08:00-22:00
      ];
      const grid = buildDayGrid({
        date: "2026-03-29",
        hours,
        courts: [{ id: COURT_A }],
        bookings: [],
        blocks: [],
        now: FAR_PAST,
      });
      expect(grid[0].slots).toHaveLength(46);
      const range = visibleRange(grid);
      if (range === null) throw new Error("expected a visible range");
      expect(grid[0].slots[range.startIndex].status).not.toBe("CLOSED");
      expect(grid[0].slots[range.endIndex].status).not.toBe("CLOSED");
    });

    it("fall back (25h day, 48 labelled slots): visible range still lands on real open slots", () => {
      const hours: CourtHoursInput[] = [
        { weekday: 0, opensAt: 480, closesAt: 1320 }, // 2026-10-25 is a Sunday, 08:00-22:00
      ];
      const grid = buildDayGrid({
        date: "2026-10-25",
        hours,
        courts: [{ id: COURT_A }],
        bookings: [],
        blocks: [],
        now: FAR_PAST,
      });
      expect(grid[0].slots).toHaveLength(48);
      const range = visibleRange(grid);
      if (range === null) throw new Error("expected a visible range");
      expect(grid[0].slots[range.startIndex].status).not.toBe("CLOSED");
      expect(grid[0].slots[range.endIndex].status).not.toBe("CLOSED");
    });
  });
});

describe("runs", () => {
  const hours: CourtHoursInput[] = [
    { weekday: TUESDAY_WEEKDAY, opensAt: 0, closesAt: 1440 },
  ];

  it("merges adjacent TAKEN slots from two different bookings into one run", () => {
    const grid = buildDayGrid({
      date: TUESDAY,
      hours,
      courts: [{ id: COURT_A }],
      bookings: [
        {
          courtId: COURT_A,
          startsAt: new Date("2026-10-20T16:00:00Z"),
          endsAt: new Date("2026-10-20T17:00:00Z"),
          status: "CONFIRMED",
        },
        {
          courtId: COURT_A,
          startsAt: new Date("2026-10-20T17:00:00Z"),
          endsAt: new Date("2026-10-20T18:00:00Z"),
          status: "PENDING",
        },
      ],
      blocks: [],
      now: FAR_PAST,
    });
    const slots = grid[0].slots.filter(
      (s) =>
        s.start.getTime() >= new Date("2026-10-20T16:00:00Z").getTime() &&
        s.start.getTime() < new Date("2026-10-20T18:00:00Z").getTime(),
    );
    const result = runs(slots);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      status: "TAKEN",
      slotCount: 4,
      start: new Date("2026-10-20T16:00:00Z"),
      end: new Date("2026-10-20T18:00:00Z"),
    });
  });

  it("never merges FREE slots, even when adjacent", () => {
    const grid = buildDayGrid({
      date: TUESDAY,
      hours,
      courts: [{ id: COURT_A }],
      bookings: [],
      blocks: [],
      now: FAR_PAST,
    });
    const slots = grid[0].slots.slice(0, 4); // four consecutive FREE slots
    expect(slots.every((s) => s.status === "FREE")).toBe(true);
    const result = runs(slots);
    expect(result).toHaveLength(4);
    expect(result.every((r) => r.slotCount === 1 && r.status === "FREE")).toBe(
      true,
    );
  });

  it("splits a PAST → FREE boundary into two runs, today", () => {
    // "now" sits exactly at slot index 2 of 4 (00:00, 00:30 PAST; 01:00, 01:30 FREE).
    const now = new Date("2026-10-19T23:00:00Z"); // 01:00 Kraków on 2026-10-20
    const grid = buildDayGrid({
      date: TUESDAY,
      hours,
      courts: [{ id: COURT_A }],
      bookings: [],
      blocks: [],
      now,
    });
    const slots = grid[0].slots.slice(0, 4);
    expect(slots.map((s) => s.status)).toEqual([
      "PAST",
      "PAST",
      "FREE",
      "FREE",
    ]);
    const result = runs(slots);
    expect(result).toHaveLength(3);
    expect(result[0]).toMatchObject({ status: "PAST", slotCount: 2 });
    expect(result[1]).toMatchObject({ status: "FREE", slotCount: 1 });
    expect(result[2]).toMatchObject({ status: "FREE", slotCount: 1 });
  });

  it("merges a whole CLOSED day into one run", () => {
    const grid = buildDayGrid({
      date: TUESDAY,
      hours: [], // no hours row for any weekday → all CLOSED
      courts: [{ id: COURT_A }],
      bookings: [],
      blocks: [],
      now: FAR_PAST,
    });
    const result = runs(grid[0].slots);
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe("CLOSED");
    expect(result[0].slotCount).toBe(grid[0].slots.length);
  });
});
