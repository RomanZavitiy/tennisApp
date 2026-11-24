"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";

import { requireUser } from "@/lib/auth/require-user";
import { db } from "@/lib/db";
import { startingPadelElo } from "@/lib/rating/starting-elo";
import { padelProfileSchema } from "@/lib/validation/padel-profile";

export type ActionResult = { ok: true } | { ok: false; message: string };

// Saves /profile/padel (slice PD2): the level and the side, together, the
// same one-save idiom as "When I like to play". Tennis fields and the ELO
// are untouched. The padel ELO (PD4) follows the level the same way the
// tennis ELO follows NTRP: re-set from it until the first confirmed padel
// result, left alone after that.
export async function updatePadelProfile(
  input: unknown,
): Promise<ActionResult> {
  const user = await requireUser();
  const t = await getTranslations("Errors");

  const parsed = padelProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: t("invalidSetting") };
  }

  const current = await db.user.findUnique({
    where: { id: user.id },
    select: { padelMatchesPlayed: true },
  });
  const stillStarting = (current?.padelMatchesPlayed ?? 0) === 0;
  const { padelLevel } = parsed.data;

  await db.user.update({
    where: { id: user.id },
    data: {
      ...parsed.data,
      ...(stillStarting
        ? {
            padelElo: padelLevel === null ? null : startingPadelElo(padelLevel),
          }
        : {}),
    },
  });

  revalidatePath("/profile");
  revalidatePath("/offers");
  return { ok: true };
}
