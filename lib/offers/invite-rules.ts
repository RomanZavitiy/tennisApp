import type {
  InviteStatus,
  JoinStatus,
  OfferStatus,
} from "@/lib/generated/prisma/enums";

// Who an offer's author may invite (task S1.1-S1.2). A pure function, mirror
// of join-rules.ts's joinRefusal — the server action only loads the rows and
// acts on the answer. One invite per (offer, invitee) pair (unique since
// this slice), so a declined invite stands rather than being retried.

export type InviteRefusal =
  | "NOT_AUTHOR"
  | "SELF"
  | "BLOCKED"
  | "STARTED"
  | "NOT_OPEN"
  | "ALREADY_JOINED"
  | "ALREADY_INVITED"
  | "DECLINED";

// Task 1.20: the message a caller shows for one of these codes comes from
// the "InviteRefusal" translation namespace, keyed by this same code.

/** Why `inviterId` can't invite `inviteeId` into `offer`, or null when they can. */
export function inviteRefusal({
  offer,
  inviterId,
  inviteeId,
  existingInvite,
  existingJoin,
  now,
  blocked = false,
}: {
  offer: { authorId: string; status: OfferStatus; startsAt: Date };
  inviterId: string;
  inviteeId: string;
  /** The invitee's earlier invite to this offer, if any. */
  existingInvite: { status: InviteStatus } | null;
  /** The invitee's earlier join request on this offer, if any. */
  existingJoin: { status: JoinStatus } | null;
  now: Date;
  /** Either side has personally blocked the other (slice R). */
  blocked?: boolean;
}): InviteRefusal | null {
  if (offer.authorId !== inviterId) {
    return "NOT_AUTHOR";
  }
  if (inviteeId === offer.authorId) {
    return "SELF";
  }
  if (blocked) {
    return "BLOCKED";
  }
  if (offer.startsAt <= now) {
    return "STARTED";
  }
  if (offer.status !== "OPEN") {
    return "NOT_OPEN";
  }
  if (
    existingJoin?.status === "REQUESTED" ||
    existingJoin?.status === "ACCEPTED"
  ) {
    return "ALREADY_JOINED";
  }
  if (
    existingInvite?.status === "PENDING" ||
    existingInvite?.status === "ACCEPTED"
  ) {
    return "ALREADY_INVITED";
  }
  // The invitee's "no" stands — same reasoning as joinRefusal's DECLINED.
  if (existingInvite?.status === "DECLINED") {
    return "DECLINED";
  }
  return null;
}
