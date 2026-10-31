"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";

import { requireOnboardedUser } from "@/lib/auth/require-onboarded-user";
import { db } from "@/lib/db";

export type DismissOfferResult = { ok: true } | { ok: false; message: string };

// "Hide this offer from my feed" (slice N): the offer board is a filtered
// list, not a swipe deck, so there's no existing "pass" action to attach
// "undo" to — hide/unhide is the faithful equivalent, named that way
// throughout (docs/TIER1-FEATURES.md). No ownership check: any onboarded
// player may dismiss any offer they can see, including their own — simplest
// to allow rather than special-case.
export async function dismissOffer(
  offerId: unknown,
): Promise<DismissOfferResult> {
  const player = await requireOnboardedUser();
  const tErrors = await getTranslations("Errors");

  const id = z.uuid().safeParse(offerId);
  if (!id.success) {
    return { ok: false, message: tErrors("offerNotFound") };
  }
  const exists = await db.sparringOffer.findUnique({
    where: { id: id.data },
    select: { id: true },
  });
  if (!exists) {
    return { ok: false, message: tErrors("offerNotFound") };
  }

  // ON CONFLICT DO NOTHING on the (user, offer) pair: dismissing twice is a
  // no-op, same idiom as requestToJoin's skipDuplicates (3.11).
  await db.offerDismissal.createMany({
    data: [{ userId: player.id, offerId: id.data }],
    skipDuplicates: true,
  });

  revalidatePath("/offers");
  return { ok: true };
}

export async function undismissOffer(
  offerId: unknown,
): Promise<DismissOfferResult> {
  const player = await requireOnboardedUser();
  const tErrors = await getTranslations("Errors");

  const id = z.uuid().safeParse(offerId);
  if (!id.success) {
    return { ok: false, message: tErrors("offerNotFound") };
  }

  // Deleting a row that isn't there is already a no-op — unlike
  // dismissOffer's insert, no existence check is needed first.
  await db.offerDismissal.deleteMany({
    where: { userId: player.id, offerId: id.data },
  });

  revalidatePath("/offers");
  return { ok: true };
}
