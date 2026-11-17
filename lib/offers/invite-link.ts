import { randomBytes, timingSafeEqual } from "node:crypto";

import { z } from "zod";

import { db } from "@/lib/db";
import type { JoinStatus, OfferStatus } from "@/lib/generated/prisma/enums";

// The invite link (slice PD3, task PD3.3; decision 2026-11-17 in
// .agents/decisions.md): an author can turn on a secret link for their
// game. A signed-in player who opens it gets an accepted place straight
// away, without waiting for the author — the link *is* the author's "yes".
// It works while the game is open and has a free place, and stops the
// moment the author turns it off or makes a new one. Server-only: the token
// is read and compared here, never sent to anyone but the author.

/** A new secret for an offer's link: 24 random bytes, URL-safe. */
export function newInviteToken(): string {
  return randomBytes(24).toString("base64url");
}

/** What a token in a URL may look like — anything else isn't looked up. */
export const inviteTokenSchema = z
  .string()
  .min(20)
  .max(64)
  .regex(/^[A-Za-z0-9_-]+$/);

/** Whether `given` is the offer's current token, in constant time. An
 * offer with no link (null) matches nothing. */
export function tokensMatch(current: string | null, given: string): boolean {
  if (current === null) {
    return false;
  }
  const a = Buffer.from(current);
  const b = Buffer.from(given);
  return a.length === b.length && timingSafeEqual(a, b);
}

export type InviteLinkRefusal =
  | "INVALID_LINK"
  | "OWN_OFFER"
  | "BLOCKED"
  | "STARTED"
  | "NOT_OPEN"
  | "WRONG_GENDER"
  | "FULL"
  | "ALREADY_IN"
  | "DECLINED";

/**
 * Why `playerId` can't take a place through the link, or null when they
 * can. Pure, mirror of join-rules.ts's joinRefusal. A bad or outdated
 * token is checked first and reads the same whatever else is true, so the
 * link can't be used to probe a game it doesn't open.
 */
export function inviteLinkRefusal({
  tokenMatches,
  offer,
  playerId,
  existingJoin,
  spotsLeft,
  now,
  blocked,
  fitsGender,
}: {
  tokenMatches: boolean;
  offer: { authorId: string; status: OfferStatus; startsAt: Date };
  playerId: string;
  /** The player's earlier join on this offer, if any. */
  existingJoin: { status: JoinStatus } | null;
  spotsLeft: number;
  now: Date;
  /** Either side has personally blocked the other (slice R). */
  blocked: boolean;
  /** lib/offers/match-gender.ts's genderFits for this player. */
  fitsGender: boolean;
}): InviteLinkRefusal | null {
  if (!tokenMatches) {
    return "INVALID_LINK";
  }
  if (offer.authorId === playerId) {
    return "OWN_OFFER";
  }
  if (blocked) {
    return "BLOCKED";
  }
  if (offer.startsAt <= now) {
    return "STARTED";
  }
  if (existingJoin?.status === "ACCEPTED") {
    return "ALREADY_IN";
  }
  if (offer.status === "FULL" || (offer.status === "OPEN" && spotsLeft <= 0)) {
    return "FULL";
  }
  if (offer.status !== "OPEN") {
    return "NOT_OPEN";
  }
  if (!fitsGender) {
    return "WRONG_GENDER";
  }
  // The author's "no" to this player stands, link or not.
  if (existingJoin?.status === "DECLINED") {
    return "DECLINED";
  }
  return null;
}

/** Whether `token` (from a URL) is this offer's current link. */
export async function inviteLinkIsValid(
  offerId: string,
  token: unknown,
): Promise<boolean> {
  const parsed = inviteTokenSchema.safeParse(token);
  if (!parsed.success || !z.uuid().safeParse(offerId).success) {
    return false;
  }
  const offer = await db.sparringOffer.findUnique({
    where: { id: offerId },
    select: { inviteToken: true },
  });
  return offer ? tokensMatch(offer.inviteToken, parsed.data) : false;
}

/** The offer's current link token — for its author's eyes only; the
 * caller checks that. */
export async function getInviteToken(offerId: string): Promise<string | null> {
  const offer = await db.sparringOffer.findUnique({
    where: { id: offerId },
    select: { inviteToken: true },
  });
  return offer?.inviteToken ?? null;
}
