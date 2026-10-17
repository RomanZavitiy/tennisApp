import { createFormatter } from "next-intl";
import { describe, expect, it } from "vitest";

import {
  formatKrakowTimeRange,
  krakowHour,
  krakowLocalToDate,
  toKrakowLocal,
} from "@/lib/offers/krakow-time";

describe("krakowLocalToDate", () => {
  it.each([
    ["2026-01-15T18:00", "2026-01-15T17:00:00.000Z"], // winter, UTC+1
    ["2026-07-15T18:00", "2026-07-15T16:00:00.000Z"], // summer, UTC+2
    ["2026-03-29T03:00", "2026-03-29T01:00:00.000Z"], // just after clocks go forward
    ["2026-10-25T02:30", "2026-10-25T00:30:00.000Z"], // repeated hour: the first one
    ["2026-10-25T03:00", "2026-10-25T02:00:00.000Z"], // just after clocks go back
  ])("reads %s as %s", (local, utc) => {
    expect(krakowLocalToDate(local)?.toISOString()).toBe(utc);
  });

  it.each([
    "2026-03-29T02:30", // skipped when clocks go forward
    "2026-02-30T10:00",
    "2026-10-20T25:00",
    "2026-10-20 18:00",
    "2026-10-20T18:00:00Z",
    "",
  ])("rejects %j", (local) => {
    expect(krakowLocalToDate(local)).toBeNull();
  });
});

describe("toKrakowLocal", () => {
  it("shows an instant as Kraków wall-clock time", () => {
    expect(toKrakowLocal(new Date("2026-07-15T22:30:00Z"))).toBe(
      "2026-07-16T00:30",
    );
    expect(toKrakowLocal(new Date("2026-01-15T23:00:00Z"))).toBe(
      "2026-01-16T00:00",
    );
  });
});

describe("krakowHour", () => {
  it("reads the hour on the clock in Kraków, not in UTC", () => {
    expect(krakowHour(new Date("2026-07-15T16:00:00Z"))).toBe(18);
    expect(krakowHour(new Date("2026-01-15T23:30:00Z"))).toBe(0);
  });
});

describe("formatKrakowTimeRange", () => {
  const format = createFormatter({ locale: "en", timeZone: "Europe/Warsaw" });

  it("shows the start and the end time", () => {
    expect(
      formatKrakowTimeRange(format, new Date("2026-10-20T16:00:00Z"), 90),
    ).toBe("Tue, Oct 20, 18:00–19:30");
  });

  it("shows only the end's time for a game past midnight", () => {
    expect(
      formatKrakowTimeRange(format, new Date("2026-10-20T21:30:00Z"), 60),
    ).toBe("Tue, Oct 20, 23:30–00:30");
  });
});
