import type { Prisma } from "@/lib/generated/prisma/client";
import {
  computeDoublesEloChanges,
  type DoublesSeat,
} from "@/lib/rating/doubles-elo";

// The write side of settling a doubles result (slice PD4) — by a human
// (confirm) or by the cron after 72h. One place that locks the row, checks
// it's still PENDING, and applies what it means, so the manual and the
// automatic path can't drift apart (the singles split: apply-elo.ts +
// reliability.ts's applyNoShow).
//
// - A score: CONFIRMED. Padel moves padelElo for every player, once, if
//   every one of them has a padel rating; otherwise the result still counts,
//   the ratings just stay (decision 2026-11-24). Tennis doubles never touch
//   the singles ELO.
// - A no-show report: NO_SHOW, and the named player's noShows + 1.
// - Either way the game counts as a scheduled match for every player on the
//   app, so the reliability percentage has the denominator a no-show needs.

const doublesForSettleSelect = {
  id: true,
  status: true,
  winner: true,
  noShowUserId: true,
  authorPartnerId: true,
  opponent1Id: true,
  opponent2Id: true,
  reportedById: true,
  offer: {
    select: {
      id: true,
      sport: true,
      authorId: true,
      joins: { where: { status: "ACCEPTED" }, select: { userId: true } },
    },
  },
} as const;

export type LockedDoublesResult = Prisma.DoublesResultGetPayload<{
  select: typeof doublesForSettleSelect;
}>;

/** Locks a doubles result and loads what settling it needs; null if gone. */
export async function lockDoublesResult(
  tx: Prisma.TransactionClient,
  id: string,
): Promise<LockedDoublesResult | null> {
  await tx.$queryRaw`SELECT 1 FROM doubles_results WHERE id = ${id}::uuid FOR UPDATE`;
  return tx.doublesResult.findUnique({
    where: { id },
    select: doublesForSettleSelect,
  });
}

/** Everyone on the app who was in this game: the author, then the joins. */
export function lockedPlayerIds(result: LockedDoublesResult): string[] {
  return [
    result.offer.authorId,
    ...result.offer.joins.map((join) => join.userId),
  ];
}

/**
 * Settles a locked, still-PENDING result. The caller has checked who may
 * do it; this only writes.
 */
export async function settleDoublesResult(
  tx: Prisma.TransactionClient,
  result: LockedDoublesResult,
): Promise<void> {
  const playerIds = lockedPlayerIds(result);
  await tx.user.updateMany({
    where: { id: { in: playerIds } },
    data: { scheduledMatches: { increment: 1 } },
  });

  if (result.noShowUserId) {
    await tx.user.update({
      where: { id: result.noShowUserId },
      data: { noShows: { increment: 1 } },
    });
    await tx.doublesResult.update({
      where: { id: result.id },
      data: { status: "NO_SHOW" },
    });
    return;
  }

  const { winner, opponent1Id, opponent2Id } = result;
  if (!winner || !opponent1Id || !opponent2Id) {
    throw new Error(
      "Pending doubles result has neither a score nor a no-show.",
    );
  }

  const eloChanges =
    result.offer.sport === "PADEL"
      ? await padelEloChanges(tx, {
          authorPair: [result.offer.authorId, result.authorPartnerId],
          otherPair: [opponent1Id, opponent2Id],
          winner,
        })
      : null;

  if (eloChanges) {
    for (const change of eloChanges) {
      await tx.user.update({
        where: { id: change.userId },
        data: {
          padelElo: change.after,
          padelMatchesPlayed: { increment: 1 },
        },
      });
    }
  }
  await tx.doublesResult.update({
    where: { id: result.id },
    data: {
      status: "CONFIRMED",
      ...(eloChanges ? { eloChanges } : {}),
    },
  });
}

async function padelEloChanges(
  tx: Prisma.TransactionClient,
  pairs: {
    authorPair: [string, string | null];
    otherPair: [string, string];
    winner: "AUTHOR" | "PLAYER";
  },
) {
  const authorIds = pairs.authorPair.filter((id): id is string => id !== null);
  const users = await tx.user.findMany({
    where: { id: { in: [...authorIds, ...pairs.otherPair] } },
    select: { id: true, padelElo: true, padelMatchesPlayed: true },
  });
  const seat = (id: string): DoublesSeat | null => {
    const user = users.find((row) => row.id === id);
    return user?.padelElo
      ? {
          userId: id,
          elo: user.padelElo,
          matchesPlayed: user.padelMatchesPlayed,
        }
      : null;
  };
  const authorPair = authorIds.map(seat);
  const otherPair = pairs.otherPair.map(seat);
  const rated = (seats: (DoublesSeat | null)[]): seats is DoublesSeat[] =>
    seats.every((one) => one !== null);
  // Someone without a padel level: no rating to start from, and guessing one
  // would move everyone else's by a made-up number.
  if (!rated(authorPair) || !rated(otherPair)) {
    return null;
  }
  return computeDoublesEloChanges({
    authorPair,
    otherPair,
    winner: pairs.winner,
  });
}
