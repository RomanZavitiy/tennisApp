"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";

import { captureEvent } from "@/lib/analytics/posthog";
import { requireOnboardedUser } from "@/lib/auth/require-onboarded-user";
import { db } from "@/lib/db";
import {
  postSystemMessage,
  THREAD_WELCOME_MESSAGE,
} from "@/lib/messages/post-system-message";
import { blockedRefusal } from "@/lib/moderation/block-rules";
import { isBlockedEitherWay } from "@/lib/moderation/personal-block";
import { notify } from "@/lib/notifications/notify";
import {
  inviteChangeRefusal,
  nextInviteStatus,
} from "@/lib/offers/invite-transitions";
import { offerStatusFor } from "@/lib/offers/join-transitions";
import { sendOfferInvite } from "@/lib/offers/send-invite";
import { checkRateLimit } from "@/lib/rate-limit/check-rate-limit";
import { recordScheduledMatch } from "@/lib/rating/reliability";

export type InviteResult = { ok: true } | { ok: false; message: string };

const INVITE_SOURCES = [
  "profile",
  "leaderboard",
  "candidates",
  "playAgain",
  "intent",
] as const;

/**
 * "Invite to game" from a player's profile, the leaderboard or the
 * candidates list (task S1.4), or "Play again"'s own trigger (Q.2,
 * `source: "playAgain"`). The rules live in lib/offers/invite-rules.ts via
 * sendOfferInvite; this only checks the actor, the rate limit (S1.5) and
 * fires the two analytics events (§4: invite_sent, candidate_invited).
 */
export async function inviteToOffer(
  offerId: unknown,
  inviteeId: unknown,
  source: unknown,
  rank?: unknown,
): Promise<InviteResult> {
  const inviter = await requireOnboardedUser();
  const tErrors = await getTranslations("Errors");

  const blocked = blockedRefusal(tErrors, inviter);
  if (blocked) {
    return { ok: false, message: blocked };
  }

  const parsedOfferId = z.uuid().safeParse(offerId);
  const parsedInviteeId = z.uuid().safeParse(inviteeId);
  if (!parsedOfferId.success || !parsedInviteeId.success) {
    return { ok: false, message: tErrors("offerNotFound") };
  }
  const parsedSource = z.enum(INVITE_SOURCES).safeParse(source);
  if (!parsedSource.success) {
    return { ok: false, message: tErrors("invalidRequest") };
  }

  const limited = await checkRateLimit(inviter.id, "OFFER_INVITE");
  if (!limited.ok) {
    const tRateLimit = await getTranslations("RateLimit");
    return { ok: false, message: tRateLimit("OFFER_INVITE") };
  }

  const outcome = await sendOfferInvite(
    parsedOfferId.data,
    inviter.id,
    parsedInviteeId.data,
    new Date(),
    parsedSource.data === "intent",
  );
  if (!outcome.ok) {
    if (outcome.refusal === "NOT_FOUND") {
      return { ok: false, message: tErrors("offerNotFound") };
    }
    const tInviteRefusal = await getTranslations("InviteRefusal");
    return { ok: false, message: tInviteRefusal(outcome.refusal) };
  }

  await captureEvent("invite_sent", inviter.id, { source: parsedSource.data });
  const parsedRank = z.coerce.number().int().positive().safeParse(rank);
  if (parsedSource.data === "candidates" && parsedRank.success) {
    await captureEvent("candidate_invited", inviter.id, {
      rank: parsedRank.data,
    });
  }
  if (parsedSource.data === "intent") {
    await captureEvent("intent_invited", inviter.id, {});
  }

  revalidatePath(`/offers/${parsedOfferId.data}`);
  return { ok: true };
}

export type InviteChangeResult = InviteResult;

/**
 * The invitee accepts (task S1.2): creates the OfferJoin straight in
 * ACCEPTED, reusing an earlier withdrawn/declined join row for the same
 * pair if one exists — same reuse idiom requestToJoin uses for its own
 * unique (offer, player) index. The offer row is locked first, same as
 * changeJoin in actions.ts, so this can't race an "accept"/"decline" on the
 * join side for the last open place.
 */
export async function acceptInvite(
  inviteId: unknown,
): Promise<InviteChangeResult> {
  const user = await requireOnboardedUser();
  const tErrors = await getTranslations("Errors");
  const tInviteChangeRefusal = await getTranslations("InviteChangeRefusal");

  const id = z.uuid().safeParse(inviteId);
  if (!id.success) {
    return { ok: false, message: tErrors("inviteNotFound") };
  }

  const result = await db.$transaction(async (tx) => {
    const invite = await tx.offerInvite.findUnique({
      where: { id: id.data },
      select: {
        offerId: true,
        inviteeId: true,
        status: true,
        fromIntent: true,
      },
    });
    // Someone else's invite looks the same as a missing one.
    if (!invite || invite.inviteeId !== user.id) {
      return { ok: false as const, message: tErrors("inviteNotFound") };
    }

    await tx.$queryRaw`SELECT 1 FROM sparring_offers WHERE id = ${invite.offerId}::uuid FOR UPDATE`;
    const offer = await tx.sparringOffer.findUniqueOrThrow({
      where: { id: invite.offerId },
      select: {
        authorId: true,
        status: true,
        format: true,
        hasPartner: true,
        startsAt: true,
        _count: { select: { joins: { where: { status: "ACCEPTED" } } } },
      },
    });
    const now = new Date();
    const blocked = await isBlockedEitherWay(user.id, offer.authorId);
    const refusal = inviteChangeRefusal({
      action: "ACCEPT",
      inviteStatus: invite.status,
      offer,
      acceptedCount: offer._count.joins,
      now,
      blocked,
    });
    if (refusal) {
      return {
        ok: false as const,
        message: tInviteChangeRefusal(refusal),
      };
    }

    await tx.offerInvite.update({
      where: { id: id.data },
      data: { status: "ACCEPTED", respondedAt: now },
    });

    const existingJoin = await tx.offerJoin.findUnique({
      where: { offerId_userId: { offerId: invite.offerId, userId: user.id } },
      select: { id: true },
    });
    const joinId = existingJoin
      ? (
          await tx.offerJoin.update({
            where: { id: existingJoin.id },
            data: { status: "ACCEPTED" },
            select: { id: true },
          })
        ).id
      : (
          await tx.offerJoin.create({
            data: {
              offerId: invite.offerId,
              userId: user.id,
              status: "ACCEPTED",
            },
            select: { id: true },
          })
        ).id;

    // A singles join reaching ACCEPTED is a newly scheduled match for both
    // sides (4.11-4.12), same as changeJoin's own ACCEPT.
    if (offer.format === "SINGLES") {
      await recordScheduledMatch(tx, [offer.authorId, user.id]);
    }
    const offerStatus = offerStatusFor(offer, offer._count.joins + 1);
    if (offerStatus !== offer.status) {
      await tx.sparringOffer.update({
        where: { id: invite.offerId },
        data: { status: offerStatus },
      });
    }

    return {
      ok: true as const,
      offerId: invite.offerId,
      authorId: offer.authorId,
      joinId,
      isNewJoin: !existingJoin,
      fromIntent: invite.fromIntent,
    };
  });

  if (!result.ok) {
    return result;
  }
  // A truly new join opens its private thread with a welcome note, same as
  // requestToJoin — reopening an earlier one doesn't get a second welcome.
  if (result.isNewJoin) {
    await postSystemMessage(
      { offerJoinId: result.joinId },
      THREAD_WELCOME_MESSAGE,
    );
  }
  await notify(result.authorId, {
    kind: "INVITE_ACCEPTED",
    offerId: result.offerId,
  });
  await captureEvent("invite_accepted", user.id, {});
  // U2.4: this invite started life as "Invite to my game" on a PlayIntent
  // card (task U2.3) — the moment it's accepted is the intent converting
  // into an actual game.
  if (result.fromIntent) {
    await captureEvent("intent_converted", user.id, {});
  }

  revalidatePath(`/offers/${result.offerId}`);
  revalidatePath("/offers");
  return { ok: true };
}

/** The invitee declines (task S1.2) — always possible while PENDING. */
export async function declineInvite(
  inviteId: unknown,
): Promise<InviteChangeResult> {
  const user = await requireOnboardedUser();
  const tErrors = await getTranslations("Errors");

  const id = z.uuid().safeParse(inviteId);
  if (!id.success) {
    return { ok: false, message: tErrors("inviteNotFound") };
  }

  const invite = await db.offerInvite.findUnique({
    where: { id: id.data },
    select: { inviteeId: true, status: true, offerId: true },
  });
  if (!invite || invite.inviteeId !== user.id) {
    return { ok: false, message: tErrors("inviteNotFound") };
  }
  const next = nextInviteStatus("DECLINE", invite.status);
  if (!next) {
    return { ok: false, message: tErrors("inviteNotFound") };
  }

  await db.offerInvite.update({
    where: { id: id.data },
    data: { status: next, respondedAt: new Date() },
  });
  await captureEvent("invite_declined", user.id, {});

  revalidatePath(`/offers/${invite.offerId}`);
  return { ok: true };
}
