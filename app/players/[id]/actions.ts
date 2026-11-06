"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";

import { requireOnboardedUser } from "@/lib/auth/require-onboarded-user";
import { db } from "@/lib/db";
import {
  createReport,
  type CreateReportResult,
} from "@/lib/moderation/create-report";
import { reportInputSchema } from "@/lib/validation/report";

/** "Report" on a player's profile page (task 3.19) — a direct report, no offer or message context. */
export async function reportPlayer(
  targetUserId: unknown,
  input: unknown,
): Promise<CreateReportResult> {
  const reporter = await requireOnboardedUser();
  const t = await getTranslations("Errors");
  const tRateLimit = await getTranslations("RateLimit");
  const tReport = await getTranslations("Validation.report");

  const id = z.uuid().safeParse(targetUserId);
  if (!id.success) {
    return { ok: false, message: t("playerNotFound") };
  }
  const parsed = reportInputSchema(tReport).safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? t("checkTheForm"),
    };
  }

  const exists = await db.user.findUnique({
    where: { id: id.data },
    select: { id: true },
  });
  if (!exists) {
    return { ok: false, message: t("playerNotFound") };
  }

  return createReport({
    t,
    tRateLimit,
    reporterId: reporter.id,
    targetUserId: id.data,
    input: parsed.data,
  });
}

export type BlockPlayerResult = { ok: true } | { ok: false; message: string };

// "Block" on a player's profile and in a join thread (slice R, tasks
// R.1/R.3): the viewer's own personal block, separate from report (3.19,
// goes to an admin) and from an admin's account-wide blockedAt (6.3/6.4,
// not the viewer's call). Reused from both places — and from
// components/join-thread.tsx — since the signature only needs the target.
export async function blockPlayer(
  targetUserId: unknown,
): Promise<BlockPlayerResult> {
  const viewer = await requireOnboardedUser();
  const t = await getTranslations("Errors");

  const id = z.uuid().safeParse(targetUserId);
  if (!id.success || id.data === viewer.id) {
    return { ok: false, message: t("playerNotFound") };
  }
  const exists = await db.user.findUnique({
    where: { id: id.data },
    select: { id: true },
  });
  if (!exists) {
    return { ok: false, message: t("playerNotFound") };
  }

  // ON CONFLICT DO NOTHING on the (blocker, blocked) pair: blocking twice is
  // a no-op, same idiom as followClub's skipDuplicates (session O1).
  await db.userBlock.createMany({
    data: [{ blockerId: viewer.id, blockedId: id.data }],
    skipDuplicates: true,
  });

  revalidatePath(`/players/${id.data}`);
  revalidatePath("/profile");
  return { ok: true };
}

export async function unblockPlayer(
  targetUserId: unknown,
): Promise<BlockPlayerResult> {
  const viewer = await requireOnboardedUser();
  const t = await getTranslations("Errors");

  const id = z.uuid().safeParse(targetUserId);
  if (!id.success) {
    return { ok: false, message: t("playerNotFound") };
  }

  // Deleting a row that isn't there is already a no-op — unlike
  // blockPlayer's insert, no existence check is needed first.
  await db.userBlock.deleteMany({
    where: { blockerId: viewer.id, blockedId: id.data },
  });

  revalidatePath(`/players/${id.data}`);
  revalidatePath("/profile");
  return { ok: true };
}
