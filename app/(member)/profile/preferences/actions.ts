"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";

import { requireUser } from "@/lib/auth/require-user";
import { db } from "@/lib/db";
import { District } from "@/lib/generated/prisma/enums";
import { TIMES_OF_DAY } from "@/lib/offers/feed-filters";
import { WEEKDAYS } from "@/lib/profile/options";

export type ActionResult = { ok: true } | { ok: false; message: string };

// "Коли я люблю грати" (slice U1, task U1.2): one save for all three
// lists, unlike NotificationSettingsForm's per-switch saves — these three
// only mean anything together, so there's nothing to lose by batching
// them. All optional: an empty array is a valid value, not a missing one.
const playPreferencesSchema = z.object({
  preferredDays: z.enum(WEEKDAYS).array(),
  preferredTimes: z.enum(TIMES_OF_DAY).array(),
  preferredDistricts: z.enum(District).array(),
});

export async function updatePlayPreferences(
  input: unknown,
): Promise<ActionResult> {
  const user = await requireUser();
  const t = await getTranslations("Errors");

  const parsed = playPreferencesSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: t("invalidSetting") };
  }

  await db.user.update({ where: { id: user.id }, data: parsed.data });

  revalidatePath("/profile/preferences");
  return { ok: true };
}
