import { describe, expect, it } from "vitest";

import {
  doublesSideOf,
  isValidNoShowTarget,
  resolveDoublesPairs,
  settleDoublesRefusal,
  submitDoublesRefusal,
  type DoublesGame,
} from "@/lib/offers/doubles-result-rules";

const NOW = new Date("2026-11-24T20:00:00Z");
const PAST = new Date("2026-11-24T17:00:00Z");

const game = (overrides: Partial<DoublesGame> = {}): DoublesGame => ({
  authorId: "author",
  format: "DOUBLES",
  status: "FULL",
  hasPartner: false,
  startsAt: PAST,
  acceptedIds: ["p1", "p2", "p3"],
  ...overrides,
});

describe("submitDoublesRefusal", () => {
  const refusal = (
    overrides: Partial<DoublesGame> = {},
    userId = "p1",
    hasExistingResult = false,
  ) =>
    submitDoublesRefusal({
      game: game(overrides),
      userId,
      hasExistingResult,
      now: NOW,
    });

  it("lets the author or any accepted player file once the game started", () => {
    expect(refusal({}, "author")).toBeNull();
    expect(refusal({}, "p3")).toBeNull();
  });

  it("refuses someone who wasn't in the game", () => {
    expect(refusal({}, "stranger")).toBe("NOT_PARTICIPANT");
  });

  it("refuses a singles offer", () => {
    expect(refusal({ format: "SINGLES", acceptedIds: ["p1"] })).toBe(
      "NOT_DOUBLES",
    );
  });

  it("refuses a game that never filled up, or was cancelled", () => {
    expect(refusal({ acceptedIds: ["p1", "p2"] })).toBe("NOT_FULL");
    expect(refusal({ status: "CANCELLED" })).toBe("NOT_FULL");
  });

  it("counts the author's own partner as a taken place", () => {
    expect(refusal({ hasPartner: true, acceptedIds: ["p1", "p2"] })).toBeNull();
  });

  it("refuses before the start, and a second result", () => {
    expect(refusal({ startsAt: new Date("2026-11-25T10:00:00Z") })).toBe(
      "NOT_STARTED",
    );
    expect(refusal({}, "p1", true)).toBe("ALREADY_SUBMITTED");
  });
});

describe("resolveDoublesPairs", () => {
  it("puts the author's chosen partner with them, the rest against them", () => {
    expect(resolveDoublesPairs(game(), "p2")).toEqual({
      authorPartnerId: "p2",
      opponent1Id: "p1",
      opponent2Id: "p3",
    });
  });

  it("refuses a partner who isn't an accepted player, or none", () => {
    expect(resolveDoublesPairs(game(), "stranger")).toBeNull();
    expect(resolveDoublesPairs(game(), "author")).toBeNull();
    expect(resolveDoublesPairs(game(), null)).toBeNull();
  });

  it("needs no choice when the author brought a partner", () => {
    const withPartner = game({ hasPartner: true, acceptedIds: ["p1", "p2"] });
    expect(resolveDoublesPairs(withPartner, null)).toEqual({
      authorPartnerId: null,
      opponent1Id: "p1",
      opponent2Id: "p2",
    });
    expect(resolveDoublesPairs(withPartner, "p1")).toBeNull();
  });
});

describe("isValidNoShowTarget", () => {
  it("accepts another player of the game, never yourself or a stranger", () => {
    expect(isValidNoShowTarget(game(), "p1", "author")).toBe(true);
    expect(isValidNoShowTarget(game(), "p1", "p1")).toBe(false);
    expect(isValidNoShowTarget(game(), "p1", "stranger")).toBe(false);
  });
});

const scored = {
  status: "PENDING" as const,
  authorId: "author",
  authorPartnerId: "p2",
  opponent1Id: "p1",
  opponent2Id: "p3",
  reportedById: "p2",
  noShowUserId: null,
};

describe("doublesSideOf", () => {
  it("knows each pair, and nobody else", () => {
    expect(doublesSideOf(scored, "author")).toBe("AUTHOR");
    expect(doublesSideOf(scored, "p2")).toBe("AUTHOR");
    expect(doublesSideOf(scored, "p3")).toBe("PLAYER");
    expect(doublesSideOf(scored, "stranger")).toBeNull();
  });
});

describe("settleDoublesRefusal", () => {
  it("lets anyone in the other pair settle a score", () => {
    expect(settleDoublesRefusal({ result: scored, userId: "p1" })).toBeNull();
    expect(settleDoublesRefusal({ result: scored, userId: "p3" })).toBeNull();
  });

  it("refuses the filer's own pair and strangers", () => {
    expect(settleDoublesRefusal({ result: scored, userId: "author" })).toBe(
      "NOT_OPPONENT",
    );
    expect(settleDoublesRefusal({ result: scored, userId: "p2" })).toBe(
      "NOT_OPPONENT",
    );
    expect(settleDoublesRefusal({ result: scored, userId: "x" })).toBe(
      "NOT_OPPONENT",
    );
  });

  it("refuses once it's settled", () => {
    expect(
      settleDoublesRefusal({
        result: { ...scored, status: "CONFIRMED" },
        userId: "p1",
      }),
    ).toBe("NOT_PENDING");
  });

  it("lets only the named player dispute a no-show report", () => {
    const noShow = {
      ...scored,
      authorPartnerId: null,
      opponent1Id: null,
      opponent2Id: null,
      reportedById: "author",
      noShowUserId: "p3",
    };
    expect(settleDoublesRefusal({ result: noShow, userId: "p3" })).toBeNull();
    expect(settleDoublesRefusal({ result: noShow, userId: "p1" })).toBe(
      "NOT_OPPONENT",
    );
  });
});
