import { describe, expect, it } from "vitest";

import { DISTRICT_LABELS, NTRP_LEVELS } from "@/lib/profile/options";

describe("profile options", () => {
  it("lists all 18 districts", () => {
    expect(Object.keys(DISTRICT_LABELS)).toHaveLength(18);
  });

  it("offers NTRP 1.5 to 7.0 in steps of 0.5", () => {
    expect(NTRP_LEVELS).toEqual([
      1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7,
    ]);
  });
});
