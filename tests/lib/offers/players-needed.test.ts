import { describe, expect, it } from "vitest";

import { playersNeeded } from "@/lib/offers/players-needed";

describe("playersNeeded", () => {
  it("needs one opponent for singles", () => {
    expect(playersNeeded({ format: "SINGLES", hasPartner: false })).toBe(1);
  });

  it("needs three players for doubles without a partner", () => {
    expect(playersNeeded({ format: "DOUBLES", hasPartner: false })).toBe(3);
  });

  it("needs two players for doubles when the author has a partner", () => {
    expect(playersNeeded({ format: "DOUBLES", hasPartner: true })).toBe(2);
  });

  it("ignores the partner mark on singles", () => {
    expect(playersNeeded({ format: "SINGLES", hasPartner: true })).toBe(1);
  });
});
