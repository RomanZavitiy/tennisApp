import type { JoinStatus, OfferStatus } from "@/lib/generated/prisma/enums";

// Who may join or leave the waitlist for a FULL offer (slice T, task T.2).
// A pure function, mirror of join-rules.ts's joinRefusal — the server
// action only loads the rows and acts on the answer.

export type WaitlistJoinRefusal =
  | "OWN_OFFER"
  | "BLOCKED"
  | "STARTED"
  | "NOT_FULL"
  | "ALREADY_JOINED"
  | "ALREADY_WAITLISTED"
  | "DECLINED";

/** Why `playerId` can't join `offer`'s waitlist, or null when they can. */
export function waitlistJoinRefusal({
  offer,
  playerId,
  existingJoin,
  alreadyWaitlisted,
  now,
  blocked = false,
}: {
  offer: { authorId: string; status: OfferStatus; startsAt: Date };
  playerId: string;
  /** The player's own join on this offer, if any. */
  existingJoin: { status: JoinStatus } | null;
  alreadyWaitlisted: boolean;
  now: Date;
  /** Either side has personally blocked the other (slice R). */
  blocked?: boolean;
}): WaitlistJoinRefusal | null {
  if (offer.authorId === playerId) {
    return "OWN_OFFER";
  }
  if (blocked) {
    return "BLOCKED";
  }
  if (offer.startsAt <= now) {
    return "STARTED";
  }
  // The waitlist only exists while the offer has no free place left — once
  // one opens, the normal "ask to join" flow applies instead.
  if (offer.status !== "FULL") {
    return "NOT_FULL";
  }
  if (
    existingJoin?.status === "REQUESTED" ||
    existingJoin?.status === "ACCEPTED"
  ) {
    return "ALREADY_JOINED";
  }
  // The author's "no" stands here too — same reasoning as joinRefusal's
  // own DECLINED case.
  if (existingJoin?.status === "DECLINED") {
    return "DECLINED";
  }
  if (alreadyWaitlisted) {
    return "ALREADY_WAITLISTED";
  }
  return null;
}

/**
 * This player's rank among `entries` still waiting, 1-based, or null if
 * they aren't in it. `entries` only needs to be ordered oldest first —
 * exactly what the promotion query already returns.
 */
export function waitlistPosition(
  entries: readonly { userId: string }[],
  playerId: string,
): number | null {
  const index = entries.findIndex((entry) => entry.userId === playerId);
  return index === -1 ? null : index + 1;
}

const HOUR_MS = 3_600_000;

/** T.4: the normal window to react to a priority request. */
export const WAITLIST_RESPONSE_WINDOW_HOURS = 2;
/** T.4: the shorter window once the offer itself starts soon. */
export const WAITLIST_URGENT_RESPONSE_WINDOW_HOURS = 1;
/** T.4: "the offer starts in under 3 hours" is what makes it urgent. */
export const WAITLIST_URGENT_THRESHOLD_HOURS = 3;

/**
 * Whether a priority request offered at `offeredAt` has gone unanswered
 * long enough to pass to the next person in line (task T.4): 2 hours
 * normally, or 1 hour once the offer itself starts in under 3 — so nobody
 * gets a "spot opened" push with no time left to act on it.
 */
export function isWaitlistOfferStale(
  offer: { startsAt: Date },
  offeredAt: Date,
  now: Date,
): boolean {
  const hoursToStart = (offer.startsAt.getTime() - now.getTime()) / HOUR_MS;
  const windowHours =
    hoursToStart < WAITLIST_URGENT_THRESHOLD_HOURS
      ? WAITLIST_URGENT_RESPONSE_WINDOW_HOURS
      : WAITLIST_RESPONSE_WINDOW_HOURS;
  return now.getTime() - offeredAt.getTime() >= windowHours * HOUR_MS;
}
