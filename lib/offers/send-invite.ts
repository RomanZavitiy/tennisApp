import { db } from "@/lib/db";
import { isBlockedEitherWay } from "@/lib/moderation/personal-block";
import { inviteRefusal, type InviteRefusal } from "@/lib/offers/invite-rules";
import { notify } from "@/lib/notifications/notify";

export type SendInviteOutcome =
  { ok: true } | { ok: false; refusal: InviteRefusal | "NOT_FOUND" };

/**
 * The OfferInvite write itself (tasks S1.1-S1.3): shared by "Invite to
 * game" (inviteToOffer, from a player's profile, the leaderboard or the
 * candidates list) and "Play again" (Q.2), which sends the same invite
 * right after creating the new offer. Rate limiting, translation and
 * analytics are each caller's own job — this only checks the rules
 * (lib/offers/invite-rules.ts) and writes the row.
 */
export async function sendOfferInvite(
  offerId: string,
  inviterId: string,
  inviteeId: string,
  now: Date = new Date(),
): Promise<SendInviteOutcome> {
  const offer = await db.sparringOffer.findUnique({
    where: { id: offerId },
    select: { authorId: true, status: true, startsAt: true },
  });
  if (!offer) {
    return { ok: false, refusal: "NOT_FOUND" };
  }

  const [existingInvite, existingJoin, blocked] = await Promise.all([
    db.offerInvite.findUnique({
      where: { offerId_inviteeId: { offerId, inviteeId } },
      select: { status: true },
    }),
    db.offerJoin.findUnique({
      where: { offerId_userId: { offerId, userId: inviteeId } },
      select: { status: true },
    }),
    isBlockedEitherWay(inviterId, inviteeId),
  ]);

  const refusal = inviteRefusal({
    offer: {
      authorId: offer.authorId,
      status: offer.status,
      startsAt: offer.startsAt,
    },
    inviterId,
    inviteeId,
    existingInvite,
    existingJoin,
    now,
    blocked,
  });
  if (refusal) {
    return { ok: false, refusal };
  }

  await db.offerInvite.create({ data: { offerId, inviterId, inviteeId } });
  await notify(inviteeId, { kind: "INVITE_RECEIVED", offerId });
  return { ok: true };
}
