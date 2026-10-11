import type {
  JoinStatus,
  OfferFormat,
  OfferStatus,
} from "@/lib/generated/prisma/enums";
import { playersNeeded } from "@/lib/offers/players-needed";

// How a join's status changes after it is requested (task 3.12), and what
// that does to the offer. Pure functions, so the whole table is tested; the
// server actions run them inside a transaction that locks the offer.
// Asking (again) to join is 3.11's joinRefusal().

export type JoinAction = "ACCEPT" | "DECLINE" | "WITHDRAW";

/** Who may take each action: the offer's author, or the player who asked. */
export const ACTION_ACTOR: Record<JoinAction, "AUTHOR" | "PLAYER"> = {
  ACCEPT: "AUTHOR",
  DECLINE: "AUTHOR",
  WITHDRAW: "PLAYER",
};

const TRANSITIONS: Record<
  JoinAction,
  Partial<Record<JoinStatus, JoinStatus>>
> = {
  ACCEPT: { REQUESTED: "ACCEPTED" },
  DECLINE: { REQUESTED: "DECLINED" },
  // Withdrawing an accepted place frees it again (model, 3.1).
  WITHDRAW: { REQUESTED: "WITHDRAWN", ACCEPTED: "WITHDRAWN" },
};

/** The join's new status, or null when the action doesn't apply to it. */
export function nextJoinStatus(
  action: JoinAction,
  current: JoinStatus,
): JoinStatus | null {
  return TRANSITIONS[action][current] ?? null;
}

export type JoinChangeRefusal =
  "NOT_ALLOWED" | "CANCELLED" | "STARTED" | "FULL";

type OfferState = {
  status: OfferStatus;
  format: OfferFormat;
  hasPartner: boolean;
  startsAt: Date;
};

/**
 * Why the action can't be taken on this join right now, or null. Declining
 * is always possible while the request is open — even on a full offer or
 * after the start — so the author can answer every request.
 */
export function joinChangeRefusal({
  action,
  joinStatus,
  offer,
  acceptedCount,
  now,
}: {
  action: JoinAction;
  joinStatus: JoinStatus;
  offer: OfferState;
  acceptedCount: number;
  now: Date;
}): JoinChangeRefusal | null {
  if (!nextJoinStatus(action, joinStatus)) {
    return "NOT_ALLOWED";
  }
  if (action === "DECLINE") {
    return null;
  }
  if (offer.status === "CANCELLED") {
    return "CANCELLED";
  }
  // After the start the line-up is history: results (Epic 4) hang off it.
  if (offer.startsAt <= now) {
    return "STARTED";
  }
  if (action === "ACCEPT" && acceptedCount >= playersNeeded(offer)) {
    return "FULL";
  }
  return null;
}

/**
 * The offer's status for a number of accepted players: FULL once every place
 * is taken, OPEN again when one frees up. A cancelled offer stays cancelled.
 */
export function offerStatusFor(
  offer: OfferState,
  acceptedCount: number,
): OfferStatus {
  if (offer.status === "CANCELLED") {
    return "CANCELLED";
  }
  return acceptedCount >= playersNeeded(offer) ? "FULL" : "OPEN";
}
