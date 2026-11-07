"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";

import { captureEvent } from "@/lib/analytics/posthog";
import { requireOnboardedUser } from "@/lib/auth/require-onboarded-user";
import { db } from "@/lib/db";
import { blockedRefusal } from "@/lib/moderation/block-rules";
import { notifyMatchingOfferAuthors } from "@/lib/notifications/intent-notify";
import { playIntentExpiresAt } from "@/lib/offers/play-intent";
import { checkRateLimit } from "@/lib/rate-limit/check-rate-limit";
import {
  playIntentFieldErrors,
  playIntentSchema,
  type PostPlayIntentResult,
} from "@/lib/validation/play-intent";

// "Хочу зіграти" (slice U2, task U2.1): posting replaces the day's intent
// if one already exists (the unique index on userId+date) — a player
// changing their mind a few times in one day doesn't need a "cancel"
// button first, just a new post for the same date.
export async function postPlayIntent(
  input: unknown,
): Promise<PostPlayIntentResult> {
  const player = await requireOnboardedUser();
  const t = await getTranslations("Validation.playIntent");
  const tErrors = await getTranslations("Errors");

  const blocked = blockedRefusal(tErrors, player);
  if (blocked) {
    return { ok: false, fieldErrors: {}, message: blocked };
  }

  const parsed = playIntentSchema(t).safeParse(input);
  if (!parsed.success) {
    return playIntentFieldErrors(parsed.error);
  }

  const limited = await checkRateLimit(player.id, "PLAY_INTENT");
  if (!limited.ok) {
    const tRateLimit = await getTranslations("RateLimit");
    return { ok: false, fieldErrors: {}, message: tRateLimit("PLAY_INTENT") };
  }

  const expiresAt = playIntentExpiresAt(parsed.data.date);
  if (!expiresAt) {
    return { ok: false, fieldErrors: { date: t("dateRequired") } };
  }

  const { date, times, districts, format, note } = parsed.data;
  const dateColumn = new Date(`${date}T00:00:00Z`);
  await db.playIntent.upsert({
    where: { userId_date: { userId: player.id, date: dateColumn } },
    create: {
      userId: player.id,
      date: dateColumn,
      times,
      districts,
      format,
      note,
      expiresAt,
    },
    update: { times, districts, format, note, expiresAt },
  });

  await captureEvent("intent_posted", player.id, {});

  // Best-effort — a player's post must land even if the matching push
  // fails for some reason (lib/notifications/new-offer.ts follows the
  // same contract for "new offer for my level").
  await notifyMatchingOfferAuthors({
    userId: player.id,
    date,
    times,
    districts,
    format,
    selfRatedNtrp: player.selfRatedNtrp,
  }).catch((error: unknown) => {
    console.error("Intent-match notification failed:", error);
  });

  revalidatePath("/offers/looking");
  return { ok: true };
}
