import { describe, expect, it } from "vitest";

import { reportInputSchema } from "@/lib/validation/report";

describe("reportInputSchema", () => {
  it("accepts a reason alone", () => {
    const result = reportInputSchema.safeParse({ reason: "NO_SHOW" });
    expect(result.success).toBe(true);
    expect(result.data?.comment).toBeUndefined();
  });

  it("accepts a reason with a comment", () => {
    const result = reportInputSchema.safeParse({
      reason: "OTHER",
      comment: "Kept asking for my phone number.",
    });
    expect(result.success).toBe(true);
  });

  it("treats an empty or blank comment as none", () => {
    expect(
      reportInputSchema.safeParse({ reason: "OTHER", comment: "" }).data
        ?.comment,
    ).toBeUndefined();
    expect(
      reportInputSchema.safeParse({ reason: "OTHER", comment: "   " }).data
        ?.comment,
    ).toBeUndefined();
  });

  it("rejects a missing or invalid reason", () => {
    expect(reportInputSchema.safeParse({}).success).toBe(false);
    expect(reportInputSchema.safeParse({ reason: "MADE_UP" }).success).toBe(
      false,
    );
  });

  it("rejects a comment over the limit", () => {
    const result = reportInputSchema.safeParse({
      reason: "OTHER",
      comment: "a".repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it("accepts a comment at the limit", () => {
    const result = reportInputSchema.safeParse({
      reason: "OTHER",
      comment: "a".repeat(500),
    });
    expect(result.success).toBe(true);
  });
});
