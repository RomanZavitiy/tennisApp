import type {
  InviteStatus,
  OfferFormat,
  OfferStatus,
} from "@/lib/generated/prisma/enums";
import { playersNeeded } from "@/lib/offers/players-needed";

// How an invite's status changes once the invitee answers (task S1.2),
// mirror of join-transitions.ts. Only the invitee acts — the inviter has
// nothing to withdraw once an invite is sent, unlike a join request.

export type InviteAction = "ACCEPT" | "DECLINE";

const TRANSITIONS: Record<
  InviteAction,
  Partial<Record<InviteStatus, InviteStatus>>
> = {
  ACCEPT: { PENDING: "ACCEPTED" },
  DECLINE: { PENDING: "DECLINED" },
};

/** The invite's new status, or null when the action doesn't apply to it. */
export function nextInviteStatus(
  action: InviteAction,
  current: InviteStatus,
): InviteStatus | null {
  return TRANSITIONS[action][current] ?? null;
}

export type InviteChangeRefusal =
  "NOT_ALLOWED" | "BLOCKED" | "STARTED" | "NOT_OPEN" | "FULL";

type OfferState = {
  status: OfferStatus;
  format: OfferFormat;
  hasPartner: boolean;
  startsAt: Date;
};

/**
 * Why the invitee can't take `action` on this invite right now, or null.
 * Declining is always possible while the invite is still pending — even on
 * a since-filled or past offer, so the invitee can always say no. Accepting
 * is checked against the same rules a join request would be (task S1.2):
 * open, not started, a free place.
 */
export function inviteChangeRefusal({
  action,
  inviteStatus,
  offer,
  acceptedCount,
  now,
  blocked = false,
}: {
  action: InviteAction;
  inviteStatus: InviteStatus;
  offer: OfferState;
  acceptedCount: number;
  now: Date;
  /** Either side has personally blocked the other (slice R) since the
   * invite was sent. */
  blocked?: boolean;
}): InviteChangeRefusal | null {
  if (!nextInviteStatus(action, inviteStatus)) {
    return "NOT_ALLOWED";
  }
  if (action === "DECLINE") {
    return null;
  }
  if (blocked) {
    return "BLOCKED";
  }
  if (offer.status === "CANCELLED") {
    return "NOT_OPEN";
  }
  if (offer.startsAt <= now) {
    return "STARTED";
  }
  if (acceptedCount >= playersNeeded(offer)) {
    return "FULL";
  }
  return null;
}
