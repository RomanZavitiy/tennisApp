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
  sports: ["TENNIS"],
  priceInfo: "60–90 zł/h",
  phone: "+48 12 000 00 00",
  websiteUrl: "https://example.com/",
  bookingUrl: null,
  bookingMode: "EXTERNAL_LINK",
  courts: [],
  hours: [],
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

  it("accepts unknown district, surfaces and indoor (2.11)", () => {
    expect(errorsFor({ district: null, surfaces: [], indoor: null })).toEqual(
      [],
    );
  });

  it("accepts the surface and indoor values added in 2.11", () => {
    expect(
      errorsFor({ surfaces: ["ARTIFICIAL_CLAY"], indoor: "PARTIAL" }),
    ).toEqual([]);
  });

  it("rejects an unknown field, so a typo can't drop data", () => {
    expect(errorsFor({ phnoe: "+48 12 000 00 00" } as object)).not.toEqual([]);
  });

  it("accepts today as the check date", () => {
    expect(errorsFor({ verifiedAt: "2026-10-06" })).toEqual([]);
  });

  describe("bookingMode, courts and hours (K.6)", () => {
    it("defaults bookingMode to EXTERNAL_LINK and courts/hours to empty when omitted", () => {
      const { bookingMode, courts, hours, ...rest } = valid;
      expect(clubSchema.parse(rest)).toEqual(valid);
      expect(bookingMode).toBe("EXTERNAL_LINK");
      expect(courts).toEqual([]);
      expect(hours).toEqual([]);
    });

    it("accepts a SPINBUDDY club with courts and hours", () => {
      expect(
        errorsFor({
          bookingMode: "SPINBUDDY",
          courts: [
            { name: "Court 1", surface: "CLAY", indoor: false },
            {
              name: "Court 2",
              surface: "HARD",
              indoor: true,
              pricePerHourPln: 90,
            },
          ],
          hours: [{ weekday: 1, opens: "08:00", closes: "22:00" }],
        }),
      ).toEqual([]);
    });

    it("accepts a court with no price as unknown, not invented", () => {
      expect(
        errorsFor({
          courts: [{ name: "Court 1", surface: "CLAY", indoor: false }],
        }),
      ).toEqual([]);
    });

    it("rejects an unknown bookingMode", () => {
      expect(errorsFor({ bookingMode: "PARTNER_X" })).not.toEqual([]);
    });

    it("rejects two courts with the same name", () => {
      expect(
        errorsFor({
          courts: [
            { name: "Court 1", surface: "CLAY", indoor: false },
            { name: "Court 1", surface: "HARD", indoor: true },
          ],
        }),
      ).not.toEqual([]);
    });

    it("rejects an unknown field on a court, so a typo can't drop data", () => {
      expect(
        errorsFor({
          courts: [
            { name: "Court 1", surface: "CLAY", indoor: false, prize: 1 },
          ],
        }),
      ).not.toEqual([]);
    });

    it("rejects two hours rows for the same weekday", () => {
      expect(
        errorsFor({
          hours: [
            { weekday: 1, opens: "08:00", closes: "22:00" },
            { weekday: 1, opens: "09:00", closes: "20:00" },
          ],
        }),
      ).not.toEqual([]);
    });

    it.each([
      ["opens", "8:00"], // not zero-padded
      ["opens", "24:00"],
      ["closes", "22:60"],
    ])("rejects hours.%s = %j", (field, value) => {
      expect(
        errorsFor({
          hours: [
            { weekday: 1, opens: "08:00", closes: "22:00", [field]: value },
          ],
        }),
      ).not.toEqual([]);
    });

    it("rejects hours where opens is not before closes", () => {
      expect(
        errorsFor({ hours: [{ weekday: 1, opens: "22:00", closes: "08:00" }] }),
      ).not.toEqual([]);
    });
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
    // Today's real date: the file's check dates are newer than the fake one.
    vi.useRealTimers();
    const data: unknown = JSON.parse(
      readFileSync("prisma/data/clubs.json", "utf8"),
    );

    expect(parseClubFile(data).length).toBeGreaterThan(0);
  });
});

describe("clubSchema sports (PD1)", () => {
  const withoutSports: Partial<ClubRecord> = { ...valid };
  delete withoutSports.sports;

  it("is tennis when the file leaves the field out", () => {
    expect(clubSchema.parse(withoutSports).sports).toEqual(["TENNIS"]);
  });

  it("accepts a club with both sports", () => {
    expect(
      clubSchema.parse({ ...valid, sports: ["TENNIS", "PADEL"] }).sports,
    ).toEqual(["TENNIS", "PADEL"]);
  });

  it("rejects an empty list, a repeat and an unknown sport", () => {
    expect(clubSchema.safeParse({ ...valid, sports: [] }).success).toBe(false);
    expect(
      clubSchema.safeParse({ ...valid, sports: ["PADEL", "PADEL"] }).success,
    ).toBe(false);
    expect(clubSchema.safeParse({ ...valid, sports: ["SQUASH"] }).success).toBe(
      false,
    );
  });
});

describe("clubSchema court sports (PD2)", () => {
  const court = { name: "Court 1", surface: "CLAY", indoor: false };

  it("makes a court tennis when the file names no sport", () => {
    const club = clubSchema.parse({ ...valid, courts: [court] });
    expect(club.courts[0]?.sport).toBe("TENNIS");
  });

  it("accepts a padel court at a club that lists padel", () => {
    const club = clubSchema.parse({
      ...valid,
      sports: ["TENNIS", "PADEL"],
      courts: [court, { ...court, name: "Padel 1", sport: "PADEL" }],
    });
    expect(club.courts.map((c) => c.sport)).toEqual(["TENNIS", "PADEL"]);
  });

  it("rejects a court whose sport the club doesn't list", () => {
    const result = clubSchema.safeParse({
      ...valid,
      courts: [{ ...court, sport: "PADEL" }],
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["courts", 0, "sport"]);
  });
});
