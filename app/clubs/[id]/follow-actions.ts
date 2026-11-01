"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";

import { captureEvent } from "@/lib/analytics/posthog";
import { requireOnboardedUser } from "@/lib/auth/require-onboarded-user";
import { db } from "@/lib/db";
import { blockedRefusal } from "@/lib/moderation/block-rules";

export type FollowClubResult = { ok: true } | { ok: false; message: string };

// Follow/unfollow a club (session O1, task O.3): free, instant, no approval
// (decision 2026-11-01). Scopes session O2's club chat to followers — not an
// open wall — so this is the only gate, same checks createOffer/sendMessage
// use.
export async function followClub(clubId: unknown): Promise<FollowClubResult> {
  const player = await requireOnboardedUser();
  const tErrors = await getTranslations("Errors");

  const blocked = blockedRefusal(tErrors, player);
  if (blocked) {
    return { ok: false, message: blocked };
  }

  const id = z.uuid().safeParse(clubId);
  if (!id.success) {
    return { ok: false, message: tErrors("clubDoesNotExist") };
  }
  const club = await db.club.findUnique({
    where: { id: id.data },
    select: { id: true },
  });
  if (!club) {
    return { ok: false, message: tErrors("clubDoesNotExist") };
  }

  // ON CONFLICT DO NOTHING on the (user, club) pair: following twice is a
  // no-op, same idiom as requestToJoin's skipDuplicates (3.11) and
  // dismissOffer's (slice N).
  await db.clubFollow.createMany({
    data: [{ userId: player.id, clubId: id.data }],
    skipDuplicates: true,
  });
  await captureEvent("club_followed", player.id, {});

  revalidatePath(`/clubs/${id.data}`);
  return { ok: true };
}

export async function unfollowClub(clubId: unknown): Promise<FollowClubResult> {
  const player = await requireOnboardedUser();
  const tErrors = await getTranslations("Errors");

  const id = z.uuid().safeParse(clubId);
  if (!id.success) {
    return { ok: false, message: tErrors("clubDoesNotExist") };
  }

  // Deleting a row that isn't there is already a no-op -- unlike
  // followClub's insert, no existence check is needed first. Unfollowing
  // removes chat access immediately (decision 2026-11-01) -- there is
  // nothing else to tear down, since nothing but the follow row itself
  // scopes that read.
  await db.clubFollow.deleteMany({
    where: { userId: player.id, clubId: id.data },
  });
  await captureEvent("club_unfollowed", player.id, {});

  revalidatePath(`/clubs/${id.data}`);
  return { ok: true };
}
