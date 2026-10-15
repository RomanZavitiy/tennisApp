// How a confirmed result (Epic 4) moves a player's ELO. Pure, so every rule
// from the formula decision (2026-10-14) has a test; the transaction that
// applies a confirmed result (4.8) only reads ratings and match counts and
// writes back what this returns.
//
// E = 1 / (1 + 10^((Rb - Ra) / 400)) — Ra's expected score against Rb.
// K = 40 for a player's first 10 confirmed matches, 20 after — each player
// keeps their own count, so one side can already be past the boundary while
// the other isn't. Result rounded (Math.round), floored at 100.

const K_HIGH = 40;
const K_LOW = 20;
const K_BOUNDARY_MATCHES = 10;
const MIN_ELO = 100;

export type MatchOutcome = "WIN" | "LOSS";

function kFactor(matchesPlayed: number): number {
  return matchesPlayed < K_BOUNDARY_MATCHES ? K_HIGH : K_LOW;
}

function expectedScore(rating: number, opponentRating: number): number {
  return 1 / (1 + 10 ** ((opponentRating - rating) / 400));
}

/**
 * A player's new ELO after one confirmed match. `matchesPlayed` is theirs
 * alone — confirmed matches played before this one, not the opponent's.
 */
export function computeEloChange({
  elo,
  opponentElo,
  outcome,
  matchesPlayed,
}: {
  elo: number;
  opponentElo: number;
  outcome: MatchOutcome;
  matchesPlayed: number;
}): number {
  const actual = outcome === "WIN" ? 1 : 0;
  const expected = expectedScore(elo, opponentElo);
  const k = kFactor(matchesPlayed);
  const next = Math.round(elo + k * (actual - expected));
  return Math.max(MIN_ELO, next);
}
