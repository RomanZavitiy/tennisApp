import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  clubSchema,
  parseClubFile,
  type ClubRecord,
} from "@/lib/validation/club";

const valid: ClubRecord = {
  slug: "kks-olsza",
  name: "KKS Olsza",
  address: "ul. Siedleckiego 7, 31-128 Kraków",
  district: "STARE_MIASTO",
  latitude: 50.055331,
  longitude: 19.949539,
  courtCount: 9,
  surfaces: ["CLAY", "HARD"],
  indoor: "WINTER_BUBBLE",
  priceInfo: "60–90 zł/h",
  phone: "+48 12 000 00 00",
  websiteUrl: "https://example.com/",
  bookingUrl: null,
  verifiedAt: "2026-10-01",
  source: "https://www.openstreetmap.org/way/1506762794",
};

function errorsFor(input: Partial<Record<keyof ClubRecord, unknown>>) {
  const result = clubSchema.safeParse({ ...valid, ...input });
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

describe("clubSchema", () => {
  it("accepts a complete club", () => {
    expect(clubSchema.parse(valid)).toEqual(valid);
  });

  it("accepts a todo list of stand-in fields", () => {
    expect(errorsFor({ todo: ["phone", "district"] })).toEqual([]);
  });

  it.each([
    ["slug", "KKS Olsza"],
    ["slug", "kks--olsza"],
    ["slug", "-kks"],
    ["slug", "a".repeat(61)],
    ["name", "   "],
    ["address", ""],
    ["district", "PODGORSKI"],
    ["latitude", 52.2297], // Warsaw
    ["longitude", 21.0122],
    ["courtCount", 0],
    ["courtCount", 2.5],
    ["surfaces", []],
    ["surfaces", ["CLAY", "CLAY"]],
    ["surfaces", ["SAND"]],
    ["indoor", "YES"],
    ["priceInfo", " "],
    ["phone", "1".repeat(31)],
    ["websiteUrl", "javascript:alert(1)"],
    ["websiteUrl", "ftp://example.com"],
    ["bookingUrl", "example.com"],
    ["verifiedAt", "2026-10-07"], // tomorrow
    ["verifiedAt", "06.10.2026"],
    ["source", undefined],
    ["source", "OpenStreetMap"],
  ])("rejects %s = %j", (field, value) => {
    const errors = errorsFor({ [field]: value });

    expect(errors).not.toEqual([]);
    expect(errors.every((error) => error.startsWith(field))).toBe(true);
  });

  it("rejects an unknown field, so a typo can't drop data", () => {
    expect(errorsFor({ phnoe: "+48 12 000 00 00" } as object)).not.toEqual([]);
  });

  it("accepts today as the check date", () => {
    expect(errorsFor({ verifiedAt: "2026-10-06" })).toEqual([]);
  });
});

describe("parseClubFile", () => {
  it("returns every record of a valid file", () => {
    const other = { ...valid, slug: "baszta", name: "Baszta" };

    expect(parseClubFile([valid, other])).toEqual([valid, other]);
  });

  it("names each bad club in one error", () => {
    const badPlace = { ...valid, slug: "a", name: "Alpha", latitude: 0 };
    const noName = { ...valid, slug: "b", name: undefined };

    expect(() => parseClubFile([valid, badPlace, noName])).toThrow(
      /Club "Alpha" — latitude: Not in Kraków\.\nClub #3 — name:/,
    );
  });

  it("rejects a slug used twice", () => {
    const copy = { ...valid, name: "KKS Olsza (copy)" };

    expect(() => parseClubFile([valid, copy])).toThrow(
      'Club "KKS Olsza (copy)" — slug: "kks-olsza" is used twice.',
    );
  });

  it("rejects a file that isn't a list", () => {
    expect(() => parseClubFile({ clubs: [] })).toThrow();
  });

  it("accepts the data file in the repo", () => {
    const data: unknown = JSON.parse(
      readFileSync("prisma/data/clubs.json", "utf8"),
    );

    expect(parseClubFile(data).length).toBeGreaterThan(0);
  });
});
