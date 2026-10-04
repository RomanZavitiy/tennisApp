import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ageOn,
  profileSchema,
  todayInKrakow,
  type ProfileInput,
} from "@/lib/validation/profile";

const valid: ProfileInput = {
  name: "Ola",
  birthDate: "1995-04-12",
  gender: "FEMALE",
  district: "KROWODRZA",
  selfRatedNtrp: 3.5,
};

function errorsFor(input: Partial<Record<keyof ProfileInput, unknown>>) {
  const result = profileSchema.safeParse({ ...valid, ...input });
  return result.success
    ? []
    : result.error.issues.map((issue) => issue.message);
}

describe("ageOn", () => {
  it.each([
    ["2010-10-04", "2026-10-04", 16], // birthday today
    ["2010-10-05", "2026-10-04", 15], // birthday tomorrow
    ["2010-10-03", "2026-10-04", 16],
    ["2008-02-29", "2025-02-28", 16], // leap-day birthday, non-leap year
    ["2008-02-29", "2025-03-01", 17],
    ["2008-02-29", "2028-02-29", 20],
  ])("born %s is %i on %s", (birthDate, today, age) => {
    expect(ageOn(birthDate, today)).toBe(age);
  });
});

describe("todayInKrakow", () => {
  it("uses the Kraków calendar date, not UTC", () => {
    // 23:30 UTC on 3 Oct is already 01:30 on 4 Oct in Kraków (CEST, UTC+2).
    expect(todayInKrakow(new Date("2026-10-03T23:30:00Z"))).toBe("2026-10-04");
    // In winter Kraków is UTC+1.
    expect(todayInKrakow(new Date("2026-12-31T22:59:00Z"))).toBe("2026-12-31");
    expect(todayInKrakow(new Date("2026-12-31T23:00:00Z"))).toBe("2027-01-01");
  });
});

describe("profileSchema", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-04T10:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("accepts a complete profile and trims the name", () => {
    expect(profileSchema.parse({ ...valid, name: "  Ola  " })).toEqual(valid);
  });

  it.each(["", "   "])("rejects the empty name %j", (name) => {
    expect(errorsFor({ name })).toEqual(["Enter your name."]);
  });

  it("rejects a name over 50 characters", () => {
    expect(errorsFor({ name: "a".repeat(51) })).toEqual([
      "Keep your name under 50 characters.",
    ]);
  });

  describe("age limit", () => {
    it("accepts someone turning 16 today", () => {
      expect(errorsFor({ birthDate: "2010-10-04" })).toEqual([]);
    });

    it("rejects someone turning 16 tomorrow", () => {
      expect(errorsFor({ birthDate: "2010-10-05" })).toEqual([
        "You must be at least 16 to join.",
      ]);
    });

    it("rejects a date in the future", () => {
      expect(errorsFor({ birthDate: "2030-01-01" })).toEqual([
        "That date is in the future.",
      ]);
    });

    it.each(["", "04.10.1995", "1995-13-01", "1995-02-30"])(
      "rejects the malformed date %j",
      (birthDate) => {
        expect(errorsFor({ birthDate })).toEqual(["Enter your date of birth."]);
      },
    );
  });

  it.each([1, 1.4, 7.5, 3.3, 3.25, Number.NaN])(
    "rejects the NTRP level %d",
    (selfRatedNtrp) => {
      expect(errorsFor({ selfRatedNtrp })).toEqual(["Choose your level."]);
    },
  );

  it.each([1.5, 4, 7])("accepts the NTRP level %d", (selfRatedNtrp) => {
    expect(errorsFor({ selfRatedNtrp })).toEqual([]);
  });

  it.each(["KAZIMIERZ", "krowodrza", ""])(
    "rejects the unknown district %j",
    (district) => {
      expect(errorsFor({ district })).toEqual(["Choose your district."]);
    },
  );

  it.each(["OTHER", "male", ""])("rejects the gender %j", (gender) => {
    expect(errorsFor({ gender })).toEqual(["Choose your gender."]);
  });
});
