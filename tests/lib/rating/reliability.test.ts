import { describe, expect, it, vi } from "vitest";

import type { Prisma } from "@/lib/generated/prisma/client";
import {
  applyNoShow,
  computeReliability,
  isLateCancellation,
  recordLateCancellation,
  recordScheduledMatch,
  reliabilityLabel,
} from "@/lib/rating/reliability";

const NOW = new Date("2026-10-20T10:00:00Z");
const AUTHOR = "author-id";
const PLAYER = "player-id";

// Only the calls each function actually makes; cast past the rest of
// Prisma.TransactionClient's surface, same as apply-elo.test.ts's fakeTx.
function fakeTx() {
  const userUpdate = vi.fn().mockResolvedValue(undefined);
  const userUpdateMany = vi.fn().mockResolvedValue(undefined);
  const matchResultUpdate = vi.fn().mockResolvedValue(undefined);
  const tx = {
    user: { update: userUpdate, updateMany: userUpdateMany },
    matchResult: { update: matchResultUpdate },
  } as unknown as Prisma.TransactionClient;
  return { tx, userUpdate, userUpdateMany, matchResultUpdate };
}

describe("isLateCancellation", () => {
  it("is not late at exactly the 12h boundary", () => {
    expect(isLateCancellation(new Date("2026-10-20T22:00:00Z"), NOW)).toBe(
      false,
    );
  });

  it("is late one millisecond inside the 12h boundary", () => {
    expect(isLateCancellation(new Date("2026-10-20T21:59:59.999Z"), NOW)).toBe(
      true,
    );
  });

  it("is not late a day before the start", () => {
    expect(isLateCancellation(new Date("2026-10-21T10:00:00Z"), NOW)).toBe(
      false,
    );
  });

  it("is late a minute before the start", () => {
    expect(isLateCancellation(new Date("2026-10-20T10:01:00Z"), NOW)).toBe(
      true,
    );
  });
});

describe("recordLateCancellation", () => {
  it("increments the player's late-cancellation counter", async () => {
    const { tx, userUpdate } = fakeTx();

    await recordLateCancellation(tx, PLAYER);

    expect(userUpdate).toHaveBeenCalledWith({
      where: { id: PLAYER },
      data: { lateCancellations: { increment: 1 } },
    });
  });
});

describe("recordScheduledMatch", () => {
  it("increments both sides of the singles join", async () => {
    const { tx, userUpdateMany } = fakeTx();

    await recordScheduledMatch(tx, [AUTHOR, PLAYER]);

    expect(userUpdateMany).toHaveBeenCalledWith({
      where: { id: { in: [AUTHOR, PLAYER] } },
      data: { scheduledMatches: { increment: 1 } },
    });
  });
});

describe("applyNoShow", () => {
  const RESULT = "result-id";

  it.each([
    ["AUTHOR", AUTHOR],
    ["PLAYER", PLAYER],
  ] as const)(
    "credits the no-show against the reported party (%s)",
    async (noShowParty, expectedUserId) => {
      const { tx, userUpdate, matchResultUpdate } = fakeTx();

      await applyNoShow(tx, RESULT, {
        noShowParty,
        offerJoin: { userId: PLAYER, offer: { authorId: AUTHOR } },
      });

      expect(userUpdate).toHaveBeenCalledWith({
        where: { id: expectedUserId },
        data: { noShows: { increment: 1 } },
      });
      expect(matchResultUpdate).toHaveBeenCalledWith({
        where: { id: RESULT },
        data: { status: "NO_SHOW" },
      });
    },
  );
});

describe("computeReliability", () => {
  it.each([0, 1, 2])(
    "is a new player with %i scheduled matches",
    (scheduledMatches) => {
      expect(
        computeReliability({
          scheduledMatches,
          noShows: 0,
          lateCancellations: 0,
        }),
      ).toEqual({ kind: "new" });
    },
  );

  it("is rated at exactly 3 scheduled matches, the boundary", () => {
    expect(
      computeReliability({
        scheduledMatches: 3,
        noShows: 0,
        lateCancellations: 0,
      }),
    ).toEqual({ kind: "rated", percent: 100 });
  });

  it("rounds the percentage", () => {
    expect(
      computeReliability({
        scheduledMatches: 3,
        noShows: 1,
        lateCancellations: 0,
      }),
    ).toEqual({ kind: "rated", percent: 67 });
  });

  it("counts a late cancellation the same as a no-show", () => {
    expect(
      computeReliability({
        scheduledMatches: 4,
        noShows: 0,
        lateCancellations: 1,
      }),
    ).toEqual({ kind: "rated", percent: 75 });
  });

  it("never drops below 0%, even if the counters ever disagree", () => {
    expect(
      computeReliability({
        scheduledMatches: 3,
        noShows: 2,
        lateCancellations: 2,
      }),
    ).toEqual({ kind: "rated", percent: 0 });
  });
});

describe("reliabilityLabel", () => {
  it('is "New player" below the threshold', () => {
    expect(reliabilityLabel({ kind: "new" })).toBe("New player");
  });

  it('is "Reliable N%" once rated', () => {
    expect(reliabilityLabel({ kind: "rated", percent: 95 })).toBe(
      "Reliable 95%",
    );
  });
});
