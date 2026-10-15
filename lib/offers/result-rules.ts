import type {
  JoinStatus,
  MatchParty,
  MatchResultStatus,
  OfferFormat,
} from "@/lib/generated/prisma/enums";

// Who may file, confirm or dispute a singles match's result (tasks 4.6,
// 4.7). Pure, so every rule has a test; the server actions (3.11's style)
// only load the rows and act on the answer.

/** Which side of the join a user is, or null when they're neither. */
export function partyOf(
  join: { userId: string; offer: { authorId: string } },
  userId: string,
): MatchParty | null {
  if (userId === join.offer.authorId) {
    return "AUTHOR";
  }
  if (userId === join.userId) {
    return "PLAYER";
  }
  return null;
}

export type SubmitResultRefusal =
  | "NOT_PARTICIPANT"
  | "NOT_SINGLES"
  | "NOT_ACCEPTED"
  | "NOT_STARTED"
  | "ALREADY_SUBMITTED";

export const SUBMIT_RESULT_REFUSAL_MESSAGES: Record<
  SubmitResultRefusal,
  string
> = {
  NOT_PARTICIPANT: "This isn't your match.",
  NOT_SINGLES: "Only singles matches record a result.",
  NOT_ACCEPTED: "This request was never accepted.",
  NOT_STARTED: "This match hasn't started yet.",
  ALREADY_SUBMITTED: "A result has already been filed for this match.",
};

/** Why `userId` may not file a result for this join right now, or null. */
export function submitResultRefusal({
  party,
  joinStatus,
  offerFormat,
  startsAt,
  hasExistingResult,
  now,
}: {
  party: MatchParty | null;
  joinStatus: JoinStatus;
  offerFormat: OfferFormat;
  startsAt: Date;
  hasExistingResult: boolean;
  now: Date;
}): SubmitResultRefusal | null {
  if (!party) {
    return "NOT_PARTICIPANT";
  }
  if (offerFormat !== "SINGLES") {
    return "NOT_SINGLES";
  }
  if (joinStatus !== "ACCEPTED") {
    return "NOT_ACCEPTED";
  }
  if (startsAt > now) {
    return "NOT_STARTED";
  }
  if (hasExistingResult) {
    return "ALREADY_SUBMITTED";
  }
  return null;
}

export type SettleResultRefusal = "NOT_OPPONENT" | "NOT_PENDING";

export const SETTLE_RESULT_REFUSAL_MESSAGES: Record<
  SettleResultRefusal,
  string
> = {
  NOT_OPPONENT: "Only the other player can confirm or dispute this result.",
  NOT_PENDING: "This result has already been settled.",
};

/**
 * Why `userId` may not confirm or dispute this result right now, or null.
 * The same rule for both actions (decision 2026-10-14): only the side that
 * didn't file it, and only while it's still PENDING.
 */
export function settleResultRefusal({
  party,
  reportedBy,
  status,
}: {
  party: MatchParty | null;
  reportedBy: MatchParty;
  status: MatchResultStatus;
}): SettleResultRefusal | null {
  if (!party || party === reportedBy) {
    return "NOT_OPPONENT";
  }
  if (status !== "PENDING") {
    return "NOT_PENDING";
  }
  return null;
}
