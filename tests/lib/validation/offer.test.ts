import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  COMMENT_MAX,
  offerSchema,
  type OfferInput,
} from "@/lib/validation/offer";

const CLUB = "33333333-3333-4333-8333-333333333333";

const valid: OfferInput = {
  startsAt: "2026-10-20T18:00",
  district: "KROWODRZA",
};

function parse(input: Record<string, unknown>) {
  return offerSchema.safeParse({ ...valid, ...input });
}

function errorsFor(input: Record<string, unknown>) {
  const result = parse(input);
  return result.success
    ? []
    : result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      }));
}

describe("offerSchema", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // 12:00 in Kraków (CEST, UTC+2).
    vi.setSystemTime(new Date("2026-10-11T10:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("accepts a minimal offer and defaults to singles without a partner", () => {
    const result = offerSchema.parse(valid);
    expect(result).toEqual({
      format: "SINGLES",
      hasPartner: false,
      startsAt: new Date("2026-10-20T16:00:00Z"),
      district: "KROWODRZA",
    });
  });

  it("accepts a full doubles offer with a partner", () => {
    const result = parse({
      format: "DOUBLES",
      hasPartner: true,
      clubId: CLUB,
      district: undefined,
      ntrpMin: 3,
      ntrpMax: 4.5,
      surface: "CLAY",
      comment: "  Evening game, balls on me.  ",
    });
    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      clubId: CLUB,
      ntrpMin: 3,
      ntrpMax: 4.5,
      comment: "Evening game, balls on me.",
    });
  });

  it("reads the start time as Kraków time", () => {
    expect(parse({ startsAt: "2026-12-01T09:30" }).data?.startsAt).toEqual(
      new Date("2026-12-01T08:30:00Z"),
    );
  });

  it("rejects a start time in the past", () => {
    expect(errorsFor({ startsAt: "2026-10-11T11:59" })).toEqual([
      { path: "startsAt", message: "That time has already passed." },
    ]);
    expect(errorsFor({ startsAt: "2026-10-11T12:01" })).toEqual([]);
  });

  it.each([undefined, "", "tomorrow", "2026-03-29T02:30"])(
    "rejects a missing or impossible start time %j",
    (startsAt) => {
      expect(errorsFor({ startsAt })).toEqual([
        { path: "startsAt", message: "Choose the start time." },
      ]);
    },
  );

  it("rejects ntrpMin above ntrpMax", () => {
    expect(errorsFor({ ntrpMin: 4, ntrpMax: 3 })).toEqual([
      {
        path: "ntrpMax",
        message: "The highest level can't be below the lowest.",
      },
    ]);
    expect(errorsFor({ ntrpMin: 3.5, ntrpMax: 3.5 })).toEqual([]);
  });

  it("allows one NTRP bound or none", () => {
    expect(errorsFor({ ntrpMin: 3 })).toEqual([]);
    expect(errorsFor({ ntrpMax: 5 })).toEqual([]);
    expect(errorsFor({ ntrpMin: "", ntrpMax: "" })).toEqual([]);
  });

  it.each([1, 3.7, 7.5])("rejects NTRP %d off the profile scale", (level) => {
    expect(errorsFor({ ntrpMin: level })).toEqual([
      { path: "ntrpMin", message: "Choose a level." },
    ]);
  });

  it("rejects an offer with neither a club nor a district", () => {
    expect(errorsFor({ district: undefined })).toEqual([
      { path: "district", message: "Choose a club or a district." },
    ]);
    expect(errorsFor({ district: "", clubId: "" })).toEqual([
      { path: "district", message: "Choose a club or a district." },
    ]);
  });

  it("accepts a club without a district", () => {
    expect(errorsFor({ district: undefined, clubId: CLUB })).toEqual([]);
  });

  it("rejects a club id that isn't a uuid", () => {
    expect(errorsFor({ clubId: "nadwislan" })).toEqual([
      { path: "clubId", message: "Choose a club from the list." },
    ]);
  });

  it("rejects a comment over the limit", () => {
    expect(COMMENT_MAX).toBe(500);
    expect(errorsFor({ comment: "a".repeat(COMMENT_MAX) })).toEqual([]);
    expect(errorsFor({ comment: "a".repeat(COMMENT_MAX + 1) })).toEqual([
      {
        path: "comment",
        message: "Keep the comment under 500 characters.",
      },
    ]);
  });

  it("drops a comment of only spaces", () => {
    expect(parse({ comment: "   " }).data?.comment).toBeUndefined();
  });

  it("rejects a partner in singles", () => {
    expect(errorsFor({ hasPartner: true })).toEqual([
      {
        path: "hasPartner",
        message: "A partner can only be added to a doubles game.",
      },
    ]);
    expect(errorsFor({ format: "SINGLES", hasPartner: true })).toHaveLength(1);
  });

  it("rejects an unknown format, district or surface", () => {
    expect(errorsFor({ format: "MIXED" })).toEqual([
      { path: "format", message: "Choose singles or doubles." },
    ]);
    expect(errorsFor({ district: "WARSZAWA" })).toEqual([
      { path: "district", message: "Choose a district." },
    ]);
    expect(errorsFor({ surface: "ICE" })).toEqual([
      { path: "surface", message: "Choose a surface." },
    ]);
  });
});
