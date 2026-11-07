import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  coachSchema,
  parseCoachFile,
  type CoachRecord,
} from "@/lib/validation/coach";

const valid: CoachRecord = {
  slug: "jan-kowalski",
  name: "Jan Kowalski",
  bio: "Former club player, coaching beginners and kids since 2015.",
  district: "STARE_MIASTO",
  levels: ["BEGINNER", "KIDS"],
  languages: ["PL", "EN"],
  priceInfo: "150 zł/h",
  phone: "+48 600 000 000",
  websiteUrl: "https://example.com/",
  verifiedAt: "2026-10-01",
  clubSlugs: ["kks-olsza"],
  source: "https://example.com/about",
};

function errorsFor(input: Partial<Record<keyof CoachRecord, unknown>>) {
  const result = coachSchema.safeParse({ ...valid, ...input });
  return result.success
    ? []
    : result.error.issues.map(
        (issue) => `${issue.path.join(".")}: ${issue.message}`,
      );
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-06T10:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("coachSchema", () => {
  it("accepts a complete coach", () => {
    expect(coachSchema.parse(valid)).toEqual(valid);
  });

  it("accepts null bio, district, priceInfo and phone", () => {
    expect(
      errorsFor({ bio: null, district: null, priceInfo: null, phone: null }),
    ).toEqual([]);
  });

  it.each([
    ["slug", "Jan Kowalski"],
    ["slug", "jan--kowalski"],
    ["slug", "-jan"],
    ["slug", "a".repeat(61)],
    ["name", "   "],
    ["bio", " "],
    ["district", "PODGORSKI"],
    ["levels", []],
    ["levels", ["BEGINNER", "BEGINNER"]],
    ["levels", ["PRO"]],
    ["languages", []],
    ["languages", ["PL", "PL"]],
    ["languages", ["DE"]],
    ["priceInfo", " "],
    ["phone", "1".repeat(31)],
    ["websiteUrl", "javascript:alert(1)"],
    ["websiteUrl", "ftp://example.com"],
    ["verifiedAt", "2026-10-07"], // tomorrow
    ["verifiedAt", "06.10.2026"],
    ["clubSlugs", []],
    ["clubSlugs", ["Kks Olsza"]],
    ["clubSlugs", ["kks-olsza", "kks-olsza"]],
    ["source", undefined],
    ["source", "example.com"],
  ])("rejects %s = %j", (field, value) => {
    const errors = errorsFor({ [field]: value });

    expect(errors).not.toEqual([]);
    expect(errors.every((error) => error.startsWith(field))).toBe(true);
  });

  it("rejects an unknown field, so a typo can't drop data", () => {
    expect(errorsFor({ phnoe: "+48 600 000 000" } as object)).not.toEqual([]);
  });

  it("accepts today as the check date", () => {
    expect(errorsFor({ verifiedAt: "2026-10-06" })).toEqual([]);
  });

  it("accepts a coach teaching at several clubs", () => {
    expect(errorsFor({ clubSlugs: ["kks-olsza", "baszta"] })).toEqual([]);
  });
});

describe("parseCoachFile", () => {
  it("returns every record of a valid file", () => {
    const other = { ...valid, slug: "anna-nowak", name: "Anna Nowak" };

    expect(parseCoachFile([valid, other])).toEqual([valid, other]);
  });

  it("names each bad coach in one error", () => {
    const noLevel = { ...valid, slug: "a", name: "Alpha", levels: [] };
    const noName = { ...valid, slug: "b", name: undefined };

    expect(() => parseCoachFile([valid, noLevel, noName])).toThrow(
      /Coach "Alpha" — levels:.*\nCoach #3 — name:/,
    );
  });

  it("rejects a slug used twice", () => {
    const copy = { ...valid, name: "Jan Kowalski (copy)" };

    expect(() => parseCoachFile([valid, copy])).toThrow(
      'Coach "Jan Kowalski (copy)" — slug: "jan-kowalski" is used twice.',
    );
  });

  it("rejects a file that isn't a list", () => {
    expect(() => parseCoachFile({ coaches: [] })).toThrow();
  });

  it("accepts the data file in the repo", () => {
    // The shipped file is an empty array (task P.5): the owner fills real,
    // consented entries. Not >0, unlike clubs.json.
    const data: unknown = JSON.parse(
      readFileSync("prisma/data/coaches.json", "utf8"),
    );

    expect(parseCoachFile(data)).toEqual([]);
  });
});
