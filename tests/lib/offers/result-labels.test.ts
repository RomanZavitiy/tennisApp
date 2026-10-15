import { describe, expect, it } from "vitest";

import {
  eloChangeLabel,
  formatScore,
  formatScoreFor,
} from "@/lib/offers/result-labels";

describe("formatScore", () => {
  it("joins each set as author-player, author's games first", () => {
    expect(
      formatScore([
        { author: 6, player: 4 },
        { author: 3, player: 6 },
        { author: 10, player: 8 },
      ]),
    ).toBe("6-4, 3-6, 10-8");
  });
});

describe("formatScoreFor", () => {
  const sets = [
    { author: 6, player: 4 },
    { author: 3, player: 6 },
  ];

  it("keeps author's games first when the viewer was the author", () => {
    expect(formatScoreFor(sets, true)).toBe("6-4, 3-6");
  });

  it("puts the viewer's own games first when they were the joining player", () => {
    expect(formatScoreFor(sets, false)).toBe("4-6, 6-3");
  });
});

describe("eloChangeLabel", () => {
  it("shows a gain with a plus sign", () => {
    expect(eloChangeLabel(1500, 1510)).toBe("1500 → 1510 (+10)");
  });

  it("shows a loss with a minus sign", () => {
    expect(eloChangeLabel(1500, 1490)).toBe("1500 → 1490 (-10)");
  });

  it("shows no change as a plus-zero", () => {
    expect(eloChangeLabel(1500, 1500)).toBe("1500 → 1500 (+0)");
  });
});
