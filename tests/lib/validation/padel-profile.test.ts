import { describe, expect, it } from "vitest";

import { padelProfileSchema } from "@/lib/validation/padel-profile";

describe("padelProfileSchema", () => {
  it("accepts a level on the padel scale with a side", () => {
    expect(
      padelProfileSchema.parse({ padelLevel: 1, padelSide: "LEFT" }),
    ).toEqual({ padelLevel: 1, padelSide: "LEFT" });
    expect(
      padelProfileSchema.parse({ padelLevel: 7, padelSide: "BOTH" }),
    ).toEqual({ padelLevel: 7, padelSide: "BOTH" });
  });

  it("accepts a level without a side", () => {
    expect(
      padelProfileSchema.parse({ padelLevel: 3.5, padelSide: null }),
    ).toEqual({ padelLevel: 3.5, padelSide: null });
  });

  it("clears the side when the level is cleared", () => {
    expect(
      padelProfileSchema.parse({ padelLevel: null, padelSide: "RIGHT" }),
    ).toEqual({ padelLevel: null, padelSide: null });
  });

  it.each([0.5, 2.25, 7.5, "3", undefined])(
    "rejects the level %s",
    (padelLevel) => {
      expect(
        padelProfileSchema.safeParse({ padelLevel, padelSide: null }).success,
      ).toBe(false);
    },
  );

  it("rejects an unknown side", () => {
    expect(
      padelProfileSchema.safeParse({ padelLevel: 3, padelSide: "MIDDLE" })
        .success,
    ).toBe(false);
  });
});
