import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  bookingRequestSchema,
  type BookingRequestInput,
} from "@/lib/validation/booking";
import { testTranslator } from "@/tests/helpers/translator";

const t = testTranslator("Validation.booking");

const COURT = "11111111-1111-4111-8111-111111111111";
const OFFER = "22222222-2222-4222-8222-222222222222";

const valid: BookingRequestInput = {
  courtId: COURT,
  startsAt: "2026-10-20T18:00",
  duration: 60,
};

function parse(input: Record<string, unknown>) {
  return bookingRequestSchema(t).safeParse({ ...valid, ...input });
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

describe("bookingRequestSchema", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // 12:00 in Kraków (CEST, UTC+2) — same reference instant as offer.test.ts.
    vi.setSystemTime(new Date("2026-10-11T10:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("accepts a minimal booking", () => {
    const result = bookingRequestSchema(t).parse(valid);
    expect(result).toEqual({
      courtId: COURT,
      startsAt: new Date("2026-10-20T16:00:00Z"),
      duration: 60,
    });
  });

  it("reads the start time as Kraków time", () => {
    // Still CEST (UTC+2) — Poland's DST doesn't end until 25 Oct 2026.
    expect(parse({ startsAt: "2026-10-14T09:30" }).data?.startsAt).toEqual(
      new Date("2026-10-14T07:30:00Z"),
    );
  });

  it.each(["", "not-a-uuid"])("rejects the invalid court %j", (courtId) => {
    expect(errorsFor({ courtId })).toEqual([
      { path: "courtId", message: "Choose a court." },
    ]);
  });

  it.each(["2026-10-20T18:15", "2026-10-20T18:45"])(
    "rejects the unaligned start time %j",
    (startsAt) => {
      expect(errorsFor({ startsAt })).toEqual([
        {
          path: "startsAt",
          message: "Choose a time on the hour or half hour.",
        },
      ]);
    },
  );

  it.each(["2026-10-20T18:00", "2026-10-20T18:30"])(
    "accepts the aligned start time %j",
    (startsAt) => {
      expect(errorsFor({ startsAt })).toEqual([]);
    },
  );

  it("rejects a start time in the past", () => {
    expect(errorsFor({ startsAt: "2026-10-11T11:30" })).toEqual([
      { path: "startsAt", message: "That time has already passed." },
    ]);
  });

  describe("the 14-day window", () => {
    // A separate, DST-free "now" (winter, no transition before mid-November)
    // so "14 days later, same wall-clock time" lands exactly on the
    // boundary instead of drifting an hour either way across a DST change.
    beforeEach(() => {
      vi.setSystemTime(new Date("2026-11-01T09:00:00Z")); // 10:00 in Kraków (CET)
    });

    it("accepts a start time exactly 14 days ahead", () => {
      expect(errorsFor({ startsAt: "2026-11-15T10:00" })).toEqual([]);
    });

    it("rejects a start time more than 14 days ahead", () => {
      expect(errorsFor({ startsAt: "2026-11-15T10:30" })).toEqual([
        { path: "startsAt", message: "Choose a time within the next 14 days." },
      ]);
    });
  });

  it("takes the duration from a select's string, and only the offered ones", () => {
    expect(parse({ duration: "90" }).data?.duration).toBe(90);
    expect(parse({ duration: "120" }).data?.duration).toBe(120);
    expect(errorsFor({ duration: "45" })).toEqual([
      { path: "duration", message: "Choose how long you want the court for." },
    ]);
    expect(errorsFor({ duration: "180" })).toEqual([
      { path: "duration", message: "Choose how long you want the court for." },
    ]);
    expect(errorsFor({ duration: "" })).toEqual([
      { path: "duration", message: "Choose how long you want the court for." },
    ]);
  });

  it("trims the note and treats a blank one as none", () => {
    expect(parse({ note: "  Bring extra balls.  " }).data?.note).toBe(
      "Bring extra balls.",
    );
    expect(parse({ note: "   " }).data?.note).toBeUndefined();
    expect(parse({}).data?.note).toBeUndefined();
  });

  it("rejects a note over 300 characters", () => {
    expect(errorsFor({ note: "a".repeat(301) })).toEqual([
      { path: "note", message: "Keep the note under 300 characters." },
    ]);
  });

  it("accepts a missing offerId and rejects an invalid one", () => {
    expect(parse({}).data?.offerId).toBeUndefined();
    expect(parse({ offerId: OFFER }).data?.offerId).toBe(OFFER);
    expect(errorsFor({ offerId: "not-a-uuid" })).toEqual([
      { path: "offerId", message: "That offer could not be found." },
    ]);
  });
});
