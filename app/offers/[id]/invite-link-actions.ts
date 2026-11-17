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
  inviteLinkRefusal,
  inviteTokenSchema,
  newInviteToken,
  tokensMatch,
} from "@/lib/offers/invite-link";
import { offerStatusFor } from "@/lib/offers/join-transitions";
import { genderFits } from "@/lib/offers/match-gender";
import { playersNeeded } from "@/lib/offers/players-needed";
import { checkRateLimit } from "@/lib/rate-limit/check-rate-limit";
import { recordScheduledMatch } from "@/lib/rating/reliability";

// The invite link (slice PD3, task PD3.3; decision 2026-11-17). Split out
// of invite-actions.ts for the 500-line ceiling (AGENTS.md §6). Who may
// take a place is lib/offers/invite-link.ts's inviteLinkRefusal.

export type InviteLinkResult = { ok: true } | { ok: false; message: string };

/** The signed-in player's own offer, or null — someone else's offer looks
 * the same as a missing one. */
async function ownOffer(offerId: unknown, authorId: string) {
  const id = z.uuid().safeParse(offerId);
  if (!id.success) {
    return null;
  }
  const offer = await db.sparringOffer.findUnique({
    where: { id: id.data },
    select: { id: true, authorId: true },
  });
  return offer?.authorId === authorId ? offer : null;
}

/**
 * Turns the link on, or replaces it: a new token is written every time, so
 * a link that got into the wrong chat stops working the moment the author
 * asks for a new one.
 */
export async function createInviteLink(
  offerId: unknown,
): Promise<InviteLinkResult> {
  const author = await requireOnboardedUser();
  const tErrors = await getTranslations("Errors");

  const blocked = blockedRefusal(tErrors, author);
  if (blocked) {
    return { ok: false, message: blocked };
  }
  const offer = await ownOffer(offerId, author.id);
  if (!offer) {
    return { ok: false, message: tErrors("offerNotFound") };
  }

  await db.sparringOffer.update({
    where: { id: offer.id },
    data: { inviteToken: newInviteToken() },
  });
  revalidatePath(`/offers/${offer.id}`);
  return { ok: true };
}

/** Turns the link off: the old one opens the game's page and nothing more. */
export async function revokeInviteLink(
  offerId: unknown,
): Promise<InviteLinkResult> {
  const author = await requireOnboardedUser();
  const tErrors = await getTranslations("Errors");

  const offer = await ownOffer(offerId, author.id);
  if (!offer) {
    return { ok: false, message: tErrors("offerNotFound") };
  }

  await db.sparringOffer.update({
    where: { id: offer.id },
    data: { inviteToken: null },
  });
  revalidatePath(`/offers/${offer.id}`);
  return { ok: true };
}

/**
 * A player takes a place through the link: an OfferJoin straight in
 * ACCEPTED, the same writes as acceptInvite (invite-actions.ts) — the
 * offer row is locked first, so two people opening the link for the last
 * place can't both get it. A player's earlier withdrawn or still-waiting
 * request on this offer is reused (one join row per player per offer).
 */
export async function joinByInviteLink(
  offerId: unknown,
  token: unknown,
): Promise<InviteLinkResult> {
  const player = await requireOnboardedUser();
  const tErrors = await getTranslations("Errors");
  const tRefusal = await getTranslations("InviteLinkRefusal");

  const blocked = blockedRefusal(tErrors, player);
  if (blocked) {
    return { ok: false, message: blocked };
  }
  const id = z.uuid().safeParse(offerId);
  const givenToken = inviteTokenSchema.safeParse(token);
  if (!id.success || !givenToken.success) {
    return { ok: false, message: tRefusal("INVALID_LINK") };
  }
  // The same limit as asking to join (6.17): it is the same kind of ask.
  const limited = await checkRateLimit(player.id, "JOIN_REQUEST");
  if (!limited.ok) {
    const tRateLimit = await getTranslations("RateLimit");
    return { ok: false, message: tRateLimit("JOIN_REQUEST") };
  }

  const result = await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT 1 FROM sparring_offers WHERE id = ${id.data}::uuid FOR UPDATE`;
    const offer = await tx.sparringOffer.findUnique({
      where: { id: id.data },
      select: {
        authorId: true,
        status: true,
        format: true,
        hasPartner: true,
        startsAt: true,
        matchGender: true,
        inviteToken: true,
        _count: { select: { joins: { where: { status: "ACCEPTED" } } } },
      },
    });
    if (!offer) {
      return { ok: false as const, refusal: "INVALID_LINK" as const };
    }
    const existingJoin = await tx.offerJoin.findUnique({
      where: { offerId_userId: { offerId: id.data, userId: player.id } },
      select: { id: true, status: true },
    });

    const refusal = inviteLinkRefusal({
      tokenMatches: tokensMatch(offer.inviteToken, givenToken.data),
      offer,
      playerId: player.id,
      existingJoin,
      spotsLeft: playersNeeded(offer) - offer._count.joins,
      now: new Date(),
      blocked: await isBlockedEitherWay(player.id, offer.authorId),
      fitsGender: genderFits(offer.matchGender, player.gender),
    });
    if (refusal) {
      return { ok: false as const, refusal };
    }

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
            data: { offerId: id.data, userId: player.id, status: "ACCEPTED" },
            select: { id: true },
          })
        ).id;

    // A singles join reaching ACCEPTED is a newly scheduled match for both
    // sides (4.11-4.12), same as acceptInvite's own.
    if (offer.format === "SINGLES") {
      await recordScheduledMatch(tx, [offer.authorId, player.id]);
    }
    const offerStatus = offerStatusFor(offer, offer._count.joins + 1);
    if (offerStatus !== offer.status) {
      await tx.sparringOffer.update({
        where: { id: id.data },
        data: { status: offerStatus },
      });
    }
    return {
      ok: true as const,
      authorId: offer.authorId,
      joinId,
      isNewJoin: !existingJoin,
    };
  });

  if (!result.ok) {
    return { ok: false, message: tRefusal(result.refusal) };
  }
  // A truly new join opens its private thread with a welcome note, same as
  // requestToJoin and acceptInvite.
  if (result.isNewJoin) {
    await postSystemMessage(
      { offerJoinId: result.joinId },
      THREAD_WELCOME_MESSAGE,
    );
  }
  await notify(result.authorId, {
    kind: "INVITE_ACCEPTED",
    offerId: id.data,
  });
  await captureEvent("invite_link_joined", player.id, {});

  revalidatePath(`/offers/${id.data}`);
  revalidatePath("/offers");
  return { ok: true };
}
