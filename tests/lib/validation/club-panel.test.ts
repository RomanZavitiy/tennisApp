import { describe, expect, it } from "vitest";

import {
  addBlockSchema,
  declineReasonSchema,
} from "@/lib/validation/club-panel";
import { testTranslator } from "@/tests/helpers/translator";

const COURT = "11111111-1111-4111-8111-111111111111";

describe("addBlockSchema", () => {
  const t = testTranslator("Validation.addBlock");
  const valid = {
    courtId: COURT,
    startsAt: "2026-10-20T18:00",
    endsAt: "2026-10-20T19:00",
  };

  it("accepts a block with no reason", () => {
    const result = addBlockSchema(t).parse(valid);
    expect(result).toEqual({
      courtId: COURT,
      startsAt: new Date("2026-10-20T16:00:00Z"),
      endsAt: new Date("2026-10-20T17:00:00Z"),
      reason: undefined,
    });
  });

  it("accepts a reason and trims it", () => {
    const result = addBlockSchema(t).parse({
      ...valid,
      reason: "  Private lesson  ",
    });
    expect(result.reason).toBe("Private lesson");
  });

  it("rejects a non-UUID court", () => {
    expect(
      addBlockSchema(t).safeParse({ ...valid, courtId: "nope" }).success,
    ).toBe(false);
  });

  it("rejects an end at or before the start", () => {
    const result = addBlockSchema(t).safeParse({
      ...valid,
      endsAt: valid.startsAt,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["endsAt"]);
    }
  });

  it("rejects a reason over 300 characters", () => {
    const result = addBlockSchema(t).safeParse({
      ...valid,
      reason: "x".repeat(301),
    });
    expect(result.success).toBe(false);
  });
});

describe("declineReasonSchema", () => {
  const t = testTranslator("Validation.declineBooking");

  it("is optional", () => {
    expect(declineReasonSchema(t).parse(undefined)).toBeUndefined();
    expect(declineReasonSchema(t).parse("")).toBeUndefined();
  });

  it("rejects a reason over 300 characters", () => {
    expect(declineReasonSchema(t).safeParse("x".repeat(301)).success).toBe(
      false,
    );
  });
});
