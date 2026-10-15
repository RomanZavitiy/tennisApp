import type { SetScore } from "@/lib/validation/match-result";

// How a confirmed or pending result's score and ELO change read on the
// offer page (task 4.6) and a player's match history (4.9).

/** "6-4, 6-3" — author's games first in every set, same order as stored. */
export function formatScore(sets: SetScore[]): string {
  return sets
    .map((set) => `${String(set.author)}-${String(set.player)}`)
    .join(", ");
}

/**
 * Like `formatScore`, but with a given player's own games first in every
 * set — for a player's own match history (4.9), where "author" and
 * "player" mean nothing to them, but "me first" reads naturally.
 */
export function formatScoreFor(
  sets: SetScore[],
  viewerWasAuthor: boolean,
): string {
  return formatScore(
    viewerWasAuthor
      ? sets
      : sets.map((set) => ({ author: set.player, player: set.author })),
  );
}

/** "1500 → 1510 (+10)" */
export function eloChangeLabel(before: number, after: number): string {
  const change = after - before;
  const sign = change >= 0 ? "+" : "";
  return `${String(before)} → ${String(after)} (${sign}${String(change)})`;
}
