"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";

import { captureEvent } from "@/lib/analytics/posthog";
import { requireOnboardedUser } from "@/lib/auth/require-onboarded-user";
import { blockedRefusal } from "@/lib/moderation/block-rules";
import { sendOfferInvite } from "@/lib/offers/send-invite";
import { getFavoritePlayers } from "@/lib/players/favorites";
import { checkRateLimit } from "@/lib/rate-limit/check-rate-limit";

export type InviteFavoritesResult =
  { ok: true; invited: number } | { ok: false; message: string };

/**
 * "Invite my favourites" (slice PD3, task PD3.4): the same invite as
 * inviteToOffer, sent to each of the author's favourites in turn. Every
 * rule is sendOfferInvite's own (only the author, an open upcoming offer,
 * no block, the match type, no second invite), and each invite counts
 * against the same OFFER_INVITE rate limit — when that runs out the rest
 * are simply not sent. A favourite who can't be invited is skipped, not an
 * error: the answer is how many invites went out.
 */
export async function inviteFavorites(
  offerId: unknown,
): Promise<InviteFavoritesResult> {
  const inviter = await requireOnboardedUser();
  const tErrors = await getTranslations("Errors");

  const blocked = blockedRefusal(tErrors, inviter);
  if (blocked) {
    return { ok: false, message: blocked };
  }
  const id = z.uuid().safeParse(offerId);
  if (!id.success) {
    return { ok: false, message: tErrors("offerNotFound") };
  }

  const favorites = await getFavoritePlayers(inviter.id);
  let invited = 0;
  for (const favorite of favorites) {
    const limited = await checkRateLimit(inviter.id, "OFFER_INVITE");
    if (!limited.ok) {
      if (invited === 0) {
        const tRateLimit = await getTranslations("RateLimit");
        return { ok: false, message: tRateLimit("OFFER_INVITE") };
      }
      break;
    }
    const outcome = await sendOfferInvite(id.data, inviter.id, favorite.id);
    if (outcome.ok) {
      invited++;
      await captureEvent("invite_sent", inviter.id, { source: "favorites" });
    } else if (
      outcome.refusal === "NOT_FOUND" ||
      outcome.refusal === "NOT_AUTHOR"
    ) {
      // Not about this favourite: nobody can be invited into this offer.
      return { ok: false, message: tErrors("offerNotFound") };
    } else if (
      outcome.refusal === "STARTED" ||
      outcome.refusal === "NOT_OPEN"
    ) {
      const tInviteRefusal = await getTranslations("InviteRefusal");
      return { ok: false, message: tInviteRefusal(outcome.refusal) };
    }
  }

  revalidatePath(`/offers/${id.data}`);
  return { ok: true, invited };
}
