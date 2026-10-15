"use server";

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
