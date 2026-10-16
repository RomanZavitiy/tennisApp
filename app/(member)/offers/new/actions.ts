"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { captureEvent } from "@/lib/analytics/posthog";
import { requireOnboardedUser } from "@/lib/auth/require-onboarded-user";
import { db } from "@/lib/db";
import { blockedRefusal } from "@/lib/moderation/block-rules";
import { notifyInterestedPlayers } from "@/lib/notifications/new-offer";
import {
  activeOffersWhere,
  MAX_ACTIVE_OFFERS,
} from "@/lib/offers/active-offers";
import { checkRateLimit } from "@/lib/rate-limit/check-rate-limit";
import {
  offerFieldErrors,
  offerSchema,
  type CreateOfferResult,
} from "@/lib/validation/offer";

// Saves /offers/new (task 3.5). The author is always the signed-in player —
// never a field from the request. requireOnboardedUser() refuses a request
// without a session and sends a player without a finished profile to
// /onboarding, so neither can post an offer.
export async function createOffer(input: unknown): Promise<CreateOfferResult> {
  const author = await requireOnboardedUser();
  const t = await getTranslations("Validation.offer");
  const tErrors = await getTranslations("Errors");

  const blocked = blockedRefusal(tErrors, author);
  if (blocked) {
    return { ok: false, fieldErrors: {}, message: blocked };
  }

  const parsed = offerSchema(t).safeParse(input);
  if (!parsed.success) {
    return offerFieldErrors(parsed.error);
  }

  // Limits (tasks 6.17, 6.16, decision 2026-10-14): the active-offer count
  // checked before the daily rate limit, since it's the more common way to
  // hit a limit in normal use (cancelling one frees a slot back up) and the
  // cheaper query.
  const activeCount = await db.sparringOffer.count({
    where: activeOffersWhere(author.id, new Date()),
  });
  if (activeCount >= MAX_ACTIVE_OFFERS) {
    return {
      ok: false,
      fieldErrors: {},
      message: tErrors("tooManyActiveOffers", { max: MAX_ACTIVE_OFFERS }),
    };
  }
  const limited = await checkRateLimit(author.id, "NEW_OFFER");
  if (!limited.ok) {
    const tRateLimit = await getTranslations("RateLimit");
    return { ok: false, fieldErrors: {}, message: tRateLimit("NEW_OFFER") };
  }
  const { clubId, district, ...offer } = parsed.data;

  // A club's district wins over the one sent: the form fills it in from the
  // club (3.5), and the server keeps the two consistent even when a request
  // skips the form. A club outside the city has no district.
  let place: { clubId?: string; district?: typeof district | null } = {
    district,
  };
  if (clubId) {
    const club = await db.club.findUnique({
      where: { id: clubId },
      select: { district: true },
    });
    if (!club) {
      return {
        ok: false,
        fieldErrors: { clubId: tErrors("clubNotFound") },
      };
    }
    place = { clubId, district: club.district };
  }

  const created = await db.sparringOffer.create({
    data: { ...offer, ...place, authorId: author.id },
    select: { id: true },
  });

  // Task 5.16: "new offer for my level", to players nearby and at a
  // matching level — never blocks the redirect below on itself failing.
  await notifyInterestedPlayers({
    offerId: created.id,
    authorId: author.id,
    district: place.district ?? null,
    ntrpMin: offer.ntrpMin ?? null,
    ntrpMax: offer.ntrpMax ?? null,
  });

  await captureEvent("offer_created", author.id, {
    format: offer.format,
    hasClub: place.clubId != null,
  });

  revalidatePath("/offers");
  // ?created=1 flags "the first offer created" (task 5.15) for
  // PushSubscribePrompt, via MarkMeaningfulAction on the offer page.
  redirect(`/offers/${created.id}?created=1`);
}
