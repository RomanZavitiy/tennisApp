import { describe, expect, it } from "vitest";

import {
  isPastDay,
  isPastSlot,
  joinLocal,
  monthGrid,
  partOfDay,
  shiftMonth,
  splitLocal,
  timeSlots,
} from "@/lib/offers/date-time-picker";

describe("splitLocal / joinLocal", () => {
  it("splits a Kraków time into its day and time", () => {
    expect(splitLocal("2026-11-16T18:30")).toEqual({
      date: "2026-11-16",
      time: "18:30",
    });
  });

  it("treats a missing or malformed part as not chosen", () => {
    expect(splitLocal("")).toEqual({ date: null, time: null });
    expect(splitLocal(undefined)).toEqual({ date: null, time: null });
    expect(splitLocal("tomorrow at six")).toEqual({ date: null, time: null });
    expect(splitLocal("2026-11-16")).toEqual({
      date: "2026-11-16",
      time: null,
    });
  });

  it("only gives the form a value once both parts are chosen", () => {
    expect(joinLocal("2026-11-16", "18:30")).toBe("2026-11-16T18:30");
    expect(joinLocal("2026-11-16", null)).toBe("");
    expect(joinLocal(null, "18:30")).toBe("");
  });
});

describe("shiftMonth", () => {
  it("moves across year boundaries both ways", () => {
    expect(shiftMonth(2026, 12, 1)).toEqual({ year: 2027, month: 1 });
    expect(shiftMonth(2027, 1, -1)).toEqual({ year: 2026, month: 12 });
    expect(shiftMonth(2026, 11, 0)).toEqual({ year: 2026, month: 11 });
  });
});

describe("monthGrid", () => {
  it("starts weeks on Monday", () => {
    // 1 November 2026 is a Sunday: six blanks, then the 1st.
    const rows = monthGrid(2026, 11);
    expect(rows[0]).toEqual([null, null, null, null, null, null, "2026-11-01"]);
    expect(rows[1]?.[0]).toBe("2026-11-02");
  });

  it("holds every day of the month once, in full weeks", () => {
    const cells = monthGrid(2028, 2).flat();
    expect(cells.length % 7).toBe(0);
    const days = cells.filter((cell) => cell !== null);
    expect(days).toHaveLength(29); // 2028 is a leap year
    expect(days.at(-1)).toBe("2028-02-29");
  });

  it("needs no blanks when the 1st is a Monday", () => {
    expect(monthGrid(2026, 6)[0]?.[0]).toBe("2026-06-01");
  });
});

describe("timeSlots", () => {
  it("offers every half hour from 06:00 to 22:00 on a 24-hour clock", () => {
    const slots = timeSlots();
    expect(slots[0]).toBe("06:00");
    expect(slots.at(-1)).toBe("22:00");
    expect(slots).toHaveLength(33);
    expect(slots).toContain("18:30");
  });

  it("keeps a prefilled off-grid time, in order", () => {
    const slots = timeSlots("10:15");
    expect(slots.slice(8, 11)).toEqual(["10:00", "10:15", "10:30"]);
    expect(timeSlots("18:00")).toHaveLength(33);
  });
});

describe("partOfDay", () => {
  it("groups the chips into morning, afternoon and evening", () => {
    expect(partOfDay("06:00")).toBe("morning");
    expect(partOfDay("11:30")).toBe("morning");
    expect(partOfDay("12:00")).toBe("afternoon");
    expect(partOfDay("16:30")).toBe("afternoon");
    expect(partOfDay("17:00")).toBe("evening");
  });
});

describe("isPastSlot / isPastDay", () => {
  const now = "2026-11-14T18:10";

  it("refuses a start at or before now", () => {
    expect(isPastSlot("2026-11-14", "18:00", now)).toBe(true);
    expect(isPastSlot("2026-11-14", "18:10", now)).toBe(true);
    expect(isPastSlot("2026-11-14", "18:30", now)).toBe(false);
    expect(isPastSlot("2026-11-15", "06:00", now)).toBe(false);
  });

  it("closes a day only once its last slot has gone", () => {
    expect(isPastDay("2026-11-13", now)).toBe(true);
    expect(isPastDay("2026-11-14", now)).toBe(false);
    expect(isPastDay("2026-11-14", "2026-11-14T22:00")).toBe(true);
  });
});
