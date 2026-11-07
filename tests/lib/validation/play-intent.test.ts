import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { playIntentSchema } from "@/lib/validation/play-intent";
import { testTranslator } from "@/tests/helpers/translator";

const schema = playIntentSchema(testTranslator("Validation.playIntent"));

describe("playIntentSchema", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-10T10:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("accepts a valid intent with no note", () => {
    const result = schema.safeParse({
      date: "2026-11-10",
      times: ["evening"],
      districts: ["STARE_MIASTO"],
      format: "SINGLES",
    });
    expect(result.success).toBe(true);
    expect(result.data?.note).toBeUndefined();
  });

  it("accepts an optional note", () => {
    const result = schema.safeParse({
      date: "2026-11-10",
      times: ["morning"],
      districts: ["PODGORZE"],
      note: "Flexible on time",
    });
    expect(result.success).toBe(true);
    expect(result.data?.note).toBe("Flexible on time");
  });

  it("defaults format to SINGLES", () => {
    const result = schema.safeParse({
      date: "2026-11-10",
      times: ["morning"],
      districts: ["PODGORZE"],
    });
    expect(result.data?.format).toBe("SINGLES");
  });

  it("rejects a date in the past", () => {
    const result = schema.safeParse({
      date: "2026-11-09",
      times: ["morning"],
      districts: ["PODGORZE"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty times or districts list", () => {
    expect(
      schema.safeParse({
        date: "2026-11-10",
        times: [],
        districts: ["PODGORZE"],
      }).success,
    ).toBe(false);
    expect(
      schema.safeParse({
        date: "2026-11-10",
        times: ["morning"],
        districts: [],
      }).success,
    ).toBe(false);
  });

  it("rejects an unknown time of day or district", () => {
    expect(
      schema.safeParse({
        date: "2026-11-10",
        times: ["midnight"],
        districts: ["PODGORZE"],
      }).success,
    ).toBe(false);
    expect(
      schema.safeParse({
        date: "2026-11-10",
        times: ["morning"],
        districts: ["MADE_UP"],
      }).success,
    ).toBe(false);
  });

  it("treats an empty note as none", () => {
    const result = schema.safeParse({
      date: "2026-11-10",
      times: ["morning"],
      districts: ["PODGORZE"],
      note: "   ",
    });
    expect(result.data?.note).toBeUndefined();
  });

  it("rejects a note over the limit", () => {
    expect(
      schema.safeParse({
        date: "2026-11-10",
        times: ["morning"],
        districts: ["PODGORZE"],
        note: "a".repeat(201),
      }).success,
    ).toBe(false);
  });
});
