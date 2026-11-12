import { describe, expect, it } from "vitest";

import { isExclusionViolation } from "@/lib/booking/db-errors";

describe("isExclusionViolation", () => {
  it("recognizes a direct Postgres error code", () => {
    expect(isExclusionViolation({ code: "23P01" })).toBe(true);
  });

  it("recognizes a code nested under meta", () => {
    expect(isExclusionViolation({ meta: { code: "23P01" } })).toBe(true);
  });

  it("recognizes a code nested under cause", () => {
    expect(isExclusionViolation({ cause: { code: "23P01" } })).toBe(true);
  });

  it("recognizes the shape Prisma 7's pg driver adapter throws", () => {
    expect(
      isExclusionViolation({
        code: "P2039",
        meta: {
          modelName: "Booking",
          driverAdapterError: {
            name: "DriverAdapterError",
            cause: { kind: "postgres", code: "23P01" },
          },
        },
      }),
    ).toBe(true);
    expect(
      isExclusionViolation({
        code: "P2039",
        meta: { driverAdapterError: { cause: { code: "23505" } } },
      }),
    ).toBe(false);
  });

  it("rejects an unrelated error", () => {
    expect(isExclusionViolation(new Error("connection lost"))).toBe(false);
  });

  it("rejects a non-object error value", () => {
    expect(isExclusionViolation("nope")).toBe(false);
    expect(isExclusionViolation(null)).toBe(false);
    expect(isExclusionViolation(undefined)).toBe(false);
  });
});
