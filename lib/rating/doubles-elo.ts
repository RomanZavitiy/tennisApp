import type { MatchParty } from "@/lib/generated/prisma/enums";
import { eloDelta, withEloFloor } from "@/lib/rating/elo";

// How a confirmed padel doubles result moves each player's padel ELO (slice
// PD4, decision 2026-11-24). Pure, so every rule has a test; the transaction
// that settles a doubles result only loads ratings and writes back what this
// returns.
//
// A pair's rating is the average of its players' ratings; the expected score
// is the pair average against the other pair's average, with the same formula
// as singles (lib/rating/elo.ts). Each player then moves by their own K (40
// for their first 10 confirmed padel results, 20 after) — so partners in the
// same K band move by exactly the same amount, and a newcomer moves faster
// than an experienced partner, the singles rule applied per player. Floor 100.
//
// The author's off-app partner (offer.hasPartner) has no rating: that pair's
// average is the author's own rating alone.

export type DoublesSeat = {
  userId: string;
  elo: number;
  matchesPlayed: number;
};

export type DoublesEloChange = {
  userId: string;
  before: number;
  after: number;
};

function average(seats: readonly DoublesSeat[]): number {
  return seats.reduce((sum, seat) => sum + seat.elo, 0) / seats.length;
}

/**
 * Every player's padel ELO after a confirmed doubles result. `authorPair` is
 * the author and (if on the app) their partner; `otherPair` the two others.
 */
export function computeDoublesEloChanges({
  authorPair,
  otherPair,
  winner,
}: {
  authorPair: readonly DoublesSeat[];
  otherPair: readonly DoublesSeat[];
  winner: MatchParty;
}): DoublesEloChange[] {
  if (authorPair.length === 0 || otherPair.length === 0) {
    throw new Error("A doubles result needs at least one rated player a side.");
  }
  const authorAverage = average(authorPair);
  const otherAverage = average(otherPair);

  const side = (
    seats: readonly DoublesSeat[],
    own: number,
    opponent: number,
    won: boolean,
  ) =>
    seats.map((seat) => ({
      userId: seat.userId,
      before: seat.elo,
      after: withEloFloor(
        seat.elo +
          eloDelta({
            elo: own,
            opponentElo: opponent,
            outcome: won ? "WIN" : "LOSS",
            matchesPlayed: seat.matchesPlayed,
          }),
      ),
    }));

  return [
    ...side(authorPair, authorAverage, otherAverage, winner === "AUTHOR"),
    ...side(otherPair, otherAverage, authorAverage, winner === "PLAYER"),
  ];
}
