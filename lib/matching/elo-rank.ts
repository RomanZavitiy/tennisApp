// "Best match" ranking for the offer feed (task 3.8): offers whose author's
// ELO is closest to the viewer's come first. A missing ELO — on either side —
// has no distance to compare, so it sorts as if it were equally far from
// everything; ties (including those) fall back to the earliest start time.

export type RankableOffer = {
  elo: number | null;
  startsAt: Date;
};

export function rankByEloCloseness<T extends RankableOffer>(
  offers: readonly T[],
  viewerElo: number | null,
): T[] {
  return [...offers].sort((a, b) => {
    const distanceA = eloDistance(a.elo, viewerElo);
    const distanceB = eloDistance(b.elo, viewerElo);
    // Infinity - Infinity is NaN, not 0, so equal (possibly infinite)
    // distances are compared for equality first rather than subtracted.
    return distanceA !== distanceB
      ? distanceA - distanceB
      : a.startsAt.getTime() - b.startsAt.getTime();
  });
}

function eloDistance(
  offerElo: number | null,
  viewerElo: number | null,
): number {
  return offerElo === null || viewerElo === null
    ? Infinity
    : Math.abs(offerElo - viewerElo);
}
