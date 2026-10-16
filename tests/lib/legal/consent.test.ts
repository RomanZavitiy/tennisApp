import { describe, expect, it } from "vitest";

import { CURRENT_CONSENT_VERSION, needsConsent } from "@/lib/legal/consent";

describe("needsConsent", () => {
  it("is true for a user who never agreed", () => {
    expect(needsConsent(null)).toBe(true);
  });

  it("is true for an older version", () => {
    expect(needsConsent("2026-01-01")).toBe(true);
  });

  it("is false once agreed to the current version", () => {
    expect(needsConsent(CURRENT_CONSENT_VERSION)).toBe(false);
  });
});
