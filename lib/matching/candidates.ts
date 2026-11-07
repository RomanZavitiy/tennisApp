import type { District } from "@/lib/generated/prisma/enums";
import { eloDistance } from "@/lib/matching/elo-rank";
import { levelMatches } from "@/lib/matching/offer-interest";
import { computeReliability, type Reliability } from "@/lib/rating/reliability";

// "Candidates to invite" on an author's own offer (task S2.1, S2.2): pure
// ranking rules only, so every rule and exclusion has a test without
// touching the database. The pool passed in has already dropped anyone
// blocked (R), who hid this offer (N), or who already has a join request or
// an invite for it (lib/offers/offer-candidates.ts) — this only applies the
// matching rules themselves: level, district, reliability, discoverable,
// and the author's own exclusion.

export const MAX_CANDIDATES = 10;

/** 80% or 3+ scheduled matches below it is "not worth suggesting"; a
 * newcomer with fewer than 3 has no reliability number yet and isn't
 * excluded for it (task S2.1 — "новачків не відсікаємо"). */
export const MIN_RELIABILITY_PERCENT = 80;

export type CandidateOffer = {
  authorId: string;
  district: District | null;
  ntrpMin: number | null;
  ntrpMax: number | null;
};

export type CandidatePlayer = {
  id: string;
  name: string | null;
  avatarPath: string | null;
  district: District | null;
  selfRatedNtrp: number | null;
  elo: number | null;
  scheduledMatches: number;
  noShows: number;
  lateCancellations: number;
  discoverable: boolean;
};

export type Candidate = {
  id: string;
  name: string | null;
  avatarPath: string | null;
  /** Non-null in practice: isEligible already requires a level in range. */
  selfRatedNtrp: number | null;
  reliability: Reliability;
};

/** Whether `player` is worth suggesting for `offer` (task S2.1's ranking
 * rules — the pool-level exclusions are the caller's job, see above). */
function isEligible(player: CandidatePlayer, offer: CandidateOffer): boolean {
  if (player.id === offer.authorId) {
    return false;
  }
  if (!player.discoverable) {
    return false;
  }
  if (player.district === null || player.district !== offer.district) {
    return false;
  }
  if (!levelMatches(player.selfRatedNtrp, offer.ntrpMin, offer.ntrpMax)) {
    return false;
  }
  const reliability = computeReliability(player);
  if (
    reliability.kind === "rated" &&
    reliability.percent < MIN_RELIABILITY_PERCENT
  ) {
    return false;
  }
  return true;
}

/**
 * The top `MAX_CANDIDATES` players worth inviting to `offer`, closest ELO
 * to the author first (task S2.1).
 */
export function rankCandidates(
  pool: readonly CandidatePlayer[],
  offer: CandidateOffer,
  authorElo: number | null,
): Candidate[] {
  return pool
    .filter((player) => isEligible(player, offer))
    .sort(
      (a, b) => eloDistance(a.elo, authorElo) - eloDistance(b.elo, authorElo),
    )
    .slice(0, MAX_CANDIDATES)
    .map((player) => ({
      id: player.id,
      name: player.name,
      avatarPath: player.avatarPath,
      selfRatedNtrp: player.selfRatedNtrp,
      reliability: computeReliability(player),
    }));
}
