import { describe, expect, it } from "vitest";

import {
  birthDays,
  birthYears,
  composeBirthDate,
  splitBirthDate,
} from "@/lib/profile/birth-date";

describe("birthYears", () => {
  it("starts at the newest year an adult could be born in, newest first", () => {
    const years = birthYears("2026-11-15");
    expect(years[0]).toBe(2008);
    expect(years[1]).toBe(2007);
    expect(years.at(-1)).toBe(1926);
  });
});

describe("birthDays", () => {
  it("offers 31 days until the month is known", () => {
    expect(birthDays(null, null)).toBe(31);
    expect(birthDays(null, 2001)).toBe(31);
  });

  it("keeps 29 February possible until the year says otherwise", () => {
    expect(birthDays(2, null)).toBe(29);
    expect(birthDays(2, 2001)).toBe(28);
    expect(birthDays(2, 2004)).toBe(29);
    expect(birthDays(4, 1990)).toBe(30);
  });
});

describe("composeBirthDate / splitBirthDate", () => {
  it("joins three chosen parts into the form's string", () => {
    expect(composeBirthDate(12, 4, 1995)).toBe("1995-04-12");
  });

  it("gives nothing while a part is missing or the date doesn't exist", () => {
    expect(composeBirthDate(null, 4, 1995)).toBe("");
    expect(composeBirthDate(12, null, 1995)).toBe("");
    expect(composeBirthDate(12, 4, null)).toBe("");
    expect(composeBirthDate(29, 2, 2001)).toBe("");
  });

  it("reads a saved date back into its parts", () => {
    expect(splitBirthDate("1995-04-12")).toEqual({
      day: 12,
      month: 4,
      year: 1995,
    });
    expect(splitBirthDate("")).toEqual({ day: null, month: null, year: null });
    expect(splitBirthDate(undefined)).toEqual({
      day: null,
      month: null,
      year: null,
    });
  });
});
