import type {
  MatchParty,
  MatchResultStatus,
  OfferFormat,
  OfferStatus,
} from "@/lib/generated/prisma/enums";
import { playersNeeded } from "@/lib/offers/players-needed";

// Who may file, confirm or dispute a doubles game's result (slice PD4,
// decision 2026-11-24). Pure, so every rule has a test; the server actions
// only load the rows and act on the answer — the singles rules' twin
// (lib/offers/result-rules.ts).
//
// The players are the author and every ACCEPTED join. The pairs: the author
// with authorPartner (or with their own off-app partner when the offer
// hasPartner), against the other two.

export type DoublesGame = {
  authorId: string;
  format: OfferFormat;
  status: OfferStatus;
  hasPartner: boolean;
  startsAt: Date;
  /** Users of the game's ACCEPTED joins. */
  acceptedIds: readonly string[];
};

export type SubmitDoublesRefusal =
  | "NOT_PARTICIPANT"
  | "NOT_DOUBLES"
  | "NOT_FULL"
  | "NOT_STARTED"
  | "ALREADY_SUBMITTED"
  | "BAD_PAIRS"
  | "BAD_NO_SHOW";

/** Everyone with an account in the game: the author first. */
export function doublesPlayerIds(game: DoublesGame): string[] {
  return [game.authorId, ...game.acceptedIds];
}

/**
 * Why `userId` may not file a result for this game right now, or null. A
 * game counts only once every place was taken — a half-empty game wasn't a
 * doubles match.
 */
export function submitDoublesRefusal({
  game,
  userId,
  hasExistingResult,
  now,
}: {
  game: DoublesGame;
  userId: string;
  hasExistingResult: boolean;
  now: Date;
}): SubmitDoublesRefusal | null {
  if (!doublesPlayerIds(game).includes(userId)) {
    return "NOT_PARTICIPANT";
  }
  if (game.format !== "DOUBLES") {
    return "NOT_DOUBLES";
  }
  if (
    game.status === "CANCELLED" ||
    game.acceptedIds.length !== playersNeeded(game)
  ) {
    return "NOT_FULL";
  }
  if (game.startsAt > now) {
    return "NOT_STARTED";
  }
  if (hasExistingResult) {
    return "ALREADY_SUBMITTED";
  }
  return null;
}

export type DoublesPairs = {
  /** Null when the author brought their own off-app partner. */
  authorPartnerId: string | null;
  opponent1Id: string;
  opponent2Id: string;
};

/**
 * The pairs from the filer's one choice — who played with the author. With
 * hasPartner there's no choice: the two accepted players are the other pair.
 * Null when the choice isn't one of the accepted players.
 */
export function resolveDoublesPairs(
  game: DoublesGame,
  authorPartnerId: string | null,
): DoublesPairs | null {
  if (game.hasPartner) {
    const [first, second] = game.acceptedIds;
    if (authorPartnerId !== null || !first || !second) {
      return null;
    }
    return { authorPartnerId: null, opponent1Id: first, opponent2Id: second };
  }
  if (authorPartnerId === null || !game.acceptedIds.includes(authorPartnerId)) {
    return null;
  }
  const [first, second] = game.acceptedIds.filter(
    (id) => id !== authorPartnerId,
  );
  if (!first || !second) {
    return null;
  }
  return { authorPartnerId, opponent1Id: first, opponent2Id: second };
}

/** Whether a no-show report names someone else in the game. */
export function isValidNoShowTarget(
  game: DoublesGame,
  filerId: string,
  noShowUserId: string,
): boolean {
  return (
    noShowUserId !== filerId && doublesPlayerIds(game).includes(noShowUserId)
  );
}

/** Which pair a player was in for a scored result, or null. */
export function doublesSideOf(
  result: {
    authorId: string;
    authorPartnerId: string | null;
    opponent1Id: string | null;
    opponent2Id: string | null;
  },
  userId: string,
): MatchParty | null {
  if (userId === result.authorId || userId === result.authorPartnerId) {
    return "AUTHOR";
  }
  if (userId === result.opponent1Id || userId === result.opponent2Id) {
    return "PLAYER";
  }
  return null;
}

export type SettleDoublesRefusal = "NOT_OPPONENT" | "NOT_PENDING";

/**
 * Why `userId` may not confirm or dispute this result, or null. A score:
 * anyone in the pair that didn't file it. A no-show report: only the player
 * it names (decision 2026-10-14's rule, one player at a time).
 */
export function settleDoublesRefusal({
  result,
  userId,
}: {
  result: {
    status: MatchResultStatus;
    authorId: string;
    authorPartnerId: string | null;
    opponent1Id: string | null;
    opponent2Id: string | null;
    reportedById: string;
    noShowUserId: string | null;
  };
  userId: string;
}): SettleDoublesRefusal | null {
  if (result.noShowUserId) {
    if (userId !== result.noShowUserId) {
      return "NOT_OPPONENT";
    }
  } else {
    const viewerSide = doublesSideOf(result, userId);
    const filerSide = doublesSideOf(result, result.reportedById);
    if (!viewerSide || viewerSide === filerSide) {
      return "NOT_OPPONENT";
    }
  }
  if (result.status !== "PENDING") {
    return "NOT_PENDING";
  }
  return null;
}
