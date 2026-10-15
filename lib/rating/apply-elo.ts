import type { Prisma } from "@/lib/generated/prisma/client";
import type { MatchParty } from "@/lib/generated/prisma/enums";
import { computeEloChange } from "@/lib/rating/elo";

// Moves both players' ELO for one confirmed result (task 4.8) and writes
// the before/after snapshots and matchesPlayed++ for each — the write side
// of a confirmation, manual (4.7) or automatic (5.8). The caller already
// holds the match_results row locked and has checked its status is still
// PENDING in the same transaction (the idempotency the double-confirmation
// test covers): this function only computes and writes, so there's exactly
// one place that does either.

export async function applyMatchElo(
  tx: Prisma.TransactionClient,
  input: {
    matchResultId: string;
    winner: MatchParty;
    authorId: string;
    authorElo: number;
    authorMatchesPlayed: number;
    playerId: string;
    playerElo: number;
    playerMatchesPlayed: number;
  },
): Promise<void> {
  const authorEloAfter = computeEloChange({
    elo: input.authorElo,
    opponentElo: input.playerElo,
    outcome: input.winner === "AUTHOR" ? "WIN" : "LOSS",
    matchesPlayed: input.authorMatchesPlayed,
  });
  const playerEloAfter = computeEloChange({
    elo: input.playerElo,
    opponentElo: input.authorElo,
    outcome: input.winner === "PLAYER" ? "WIN" : "LOSS",
    matchesPlayed: input.playerMatchesPlayed,
  });

  await tx.user.update({
    where: { id: input.authorId },
    data: { elo: authorEloAfter, matchesPlayed: { increment: 1 } },
  });
  await tx.user.update({
    where: { id: input.playerId },
    data: { elo: playerEloAfter, matchesPlayed: { increment: 1 } },
  });
  await tx.matchResult.update({
    where: { id: input.matchResultId },
    data: {
      status: "CONFIRMED",
      authorEloBefore: input.authorElo,
      authorEloAfter,
      playerEloBefore: input.playerElo,
      playerEloAfter,
    },
  });
}

/** What confirmResult (4.7) and the auto-confirm cron (5.8) both load before applying ELO. */
export type PendingResultJoin = {
  winner: MatchParty;
  offerJoin: {
    userId: string;
    offer: {
      authorId: string;
      author: { elo: number | null; matchesPlayed: number };
    };
    user: { elo: number | null; matchesPlayed: number };
  };
};

/**
 * `applyMatchElo` from the shape a result's join query returns, for the two
 * places that confirm a PENDING result: the human action and the cron job.
 * Both already hold the row locked and know it's still PENDING; this is
 * only the "turn that data into applyMatchElo's flat input" step they'd
 * otherwise each repeat.
 */
export async function applyMatchEloFromJoin(
  tx: Prisma.TransactionClient,
  matchResultId: string,
  { winner, offerJoin }: PendingResultJoin,
): Promise<void> {
  const { author, ...offer } = offerJoin.offer;
  const { user: player } = offerJoin;
  if (author.elo === null || player.elo === null) {
    // The onboarding CHECK guarantees this; a null here is a bug to
    // surface, not a rating to guess (same stance as startingElo).
    throw new Error("Can't apply ELO: a participant has no rating yet.");
  }
  await applyMatchElo(tx, {
    matchResultId,
    winner,
    authorId: offer.authorId,
    authorElo: author.elo,
    authorMatchesPlayed: author.matchesPlayed,
    playerId: offerJoin.userId,
    playerElo: player.elo,
    playerMatchesPlayed: player.matchesPlayed,
  });
}
