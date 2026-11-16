"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";

import { requireUser } from "@/lib/auth/require-user";
import { db } from "@/lib/db";
import { padelProfileSchema } from "@/lib/validation/padel-profile";

export type ActionResult = { ok: true } | { ok: false; message: string };

// Saves /profile/padel (slice PD2): the level and the side, together, the
// same one-save idiom as "When I like to play". Tennis fields and the ELO
// are untouched — a padel rating of its own comes with PD4.
export async function updatePadelProfile(
  input: unknown,
): Promise<ActionResult> {
  const user = await requireUser();
  const t = await getTranslations("Errors");

  const parsed = padelProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: t("invalidSetting") };
  }

  await db.user.update({ where: { id: user.id }, data: parsed.data });

  revalidatePath("/profile");
  revalidatePath("/offers");
  return { ok: true };
}
