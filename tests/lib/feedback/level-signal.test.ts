import { describe, expect, it } from "vitest";

import {
  computeLevelHint,
  LEVEL_SIGNAL_THRESHOLD,
} from "@/lib/feedback/level-signal";

describe("computeLevelHint", () => {
  it("is null below the threshold on both sides", () => {
    expect(
      computeLevelHint({
        higher: LEVEL_SIGNAL_THRESHOLD - 1,
        lower: LEVEL_SIGNAL_THRESHOLD - 1,
      }),
    ).toBeNull();
  });

  it("is HIGHER exactly at the threshold", () => {
    expect(computeLevelHint({ higher: LEVEL_SIGNAL_THRESHOLD, lower: 0 })).toBe(
      "HIGHER",
    );
  });

  it("is LOWER exactly at the threshold", () => {
    expect(computeLevelHint({ higher: 0, lower: LEVEL_SIGNAL_THRESHOLD })).toBe(
      "LOWER",
    );
  });

  it("favours the larger side when both qualify", () => {
    expect(
      computeLevelHint({
        higher: LEVEL_SIGNAL_THRESHOLD,
        lower: LEVEL_SIGNAL_THRESHOLD + 2,
      }),
    ).toBe("LOWER");
  });

  it("favours HIGHER on an exact tie", () => {
    expect(
      computeLevelHint({
        higher: LEVEL_SIGNAL_THRESHOLD,
        lower: LEVEL_SIGNAL_THRESHOLD,
      }),
    ).toBe("HIGHER");
  });
});
