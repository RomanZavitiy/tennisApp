"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";

import { captureEvent } from "@/lib/analytics/posthog";
import { requireOnboardedUser } from "@/lib/auth/require-onboarded-user";
import { db } from "@/lib/db";
import { blockedRefusal } from "@/lib/moderation/block-rules";
import { isBlockedEitherWay } from "@/lib/moderation/personal-block";
import { checkRateLimit } from "@/lib/rate-limit/check-rate-limit";
import { waitlistJoinRefusal } from "@/lib/offers/waitlist-rules";

export type WaitlistActionResult =
  { ok: true } | { ok: false; message: string };

// "Стати в резерв" / leave it (slice T, task T.2), pulled out of actions.ts
// (AGENTS.md §6's 500-line ceiling), same reasoning invite-actions.ts was
// split out for S1. Who may join is lib/offers/waitlist-rules.ts; the
// priority-request side of this (T.3) is lib/offers/promote-waitlist.ts,
// run from changeJoin (actions.ts) and the hourly cron (reminders.ts).
export async function joinWaitlist(
  offerId: unknown,
): Promise<WaitlistActionResult> {
  const player = await requireOnboardedUser();
  const tErrors = await getTranslations("Errors");

  const blocked = blockedRefusal(tErrors, player);
  if (blocked) {
    return { ok: false, message: blocked };
  }

  const id = z.uuid().safeParse(offerId);
  if (!id.success) {
    return { ok: false, message: tErrors("offerNotFound") };
  }
  // Reuses JOIN_REQUEST's own limit (6.17): joining a waitlist is the same
  // kind of ask as requesting to join directly, just on a full offer.
  const limited = await checkRateLimit(player.id, "JOIN_REQUEST");
  if (!limited.ok) {
    const tRateLimit = await getTranslations("RateLimit");
    return { ok: false, message: tRateLimit("JOIN_REQUEST") };
  }

  const offer = await db.sparringOffer.findUnique({
    where: { id: id.data },
    select: { authorId: true, status: true, startsAt: true },
  });
  if (!offer) {
    return { ok: false, message: tErrors("offerNotFound") };
  }

  const [existingJoin, existingWaitlist] = await Promise.all([
    db.offerJoin.findUnique({
      where: { offerId_userId: { offerId: id.data, userId: player.id } },
      select: { status: true },
    }),
    db.offerWaitlist.findUnique({
      where: { offerId_userId: { offerId: id.data, userId: player.id } },
      select: { id: true },
    }),
  ]);

  const tWaitlistRefusal = await getTranslations("WaitlistRefusal");
  const refusal = waitlistJoinRefusal({
    offer,
    playerId: player.id,
    existingJoin,
    alreadyWaitlisted: existingWaitlist !== null,
    now: new Date(),
    blocked: await isBlockedEitherWay(player.id, offer.authorId),
  });
  if (refusal) {
    return { ok: false, message: tWaitlistRefusal(refusal) };
  }

  const created = (
    await db.offerWaitlist.createManyAndReturn({
      data: [{ offerId: id.data, userId: player.id }],
      select: { id: true },
      skipDuplicates: true,
    })
  ).at(0);
  if (!created) {
    return { ok: false, message: tWaitlistRefusal("ALREADY_WAITLISTED") };
  }

  await captureEvent("waitlist_joined", player.id, {});

  revalidatePath(`/offers/${id.data}`);
  return { ok: true };
}

/** Always possible — leaving the waitlist needs no rule check. */
export async function leaveWaitlist(
  offerId: unknown,
): Promise<WaitlistActionResult> {
  const player = await requireOnboardedUser();
  const tErrors = await getTranslations("Errors");

  const id = z.uuid().safeParse(offerId);
  if (!id.success) {
    return { ok: false, message: tErrors("offerNotFound") };
  }

  await db.offerWaitlist.deleteMany({
    where: { offerId: id.data, userId: player.id },
  });

  revalidatePath(`/offers/${id.data}`);
  return { ok: true };
}
