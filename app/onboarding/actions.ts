"use server";

import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { z } from "zod";

import { captureEvent } from "@/lib/analytics/posthog";
import { requireUser } from "@/lib/auth/require-user";
import { db } from "@/lib/db";
import { CURRENT_CONSENT_VERSION } from "@/lib/legal/consent";
import { startingElo } from "@/lib/rating/starting-elo";
import {
  profileFieldErrors,
  profileSchema,
  profileToUserData,
  type SaveProfileResult,
} from "@/lib/validation/profile";

// Saves the onboarding form. The schema runs again here because a request can
// skip the browser's checks; on failure the first message per field goes back
// to the form, on success the user lands on the home page. The starting ELO
// comes from the chosen NTRP (4.1). Only a first onboarding writes anything:
// the action is a public endpoint, and calling it again must not reset the
// rating of a player who has already played (4.2).
export async function completeOnboarding(
  input: unknown,
): Promise<SaveProfileResult> {
  const user = await requireUser();

  const t = await getTranslations("Validation.profile");
  const parsed = profileSchema(t).safeParse(input);
  if (!parsed.success) {
    return profileFieldErrors(parsed.error);
  }
  // agreeToTerms isn't part of profileSchema (lib/validation/profile.ts's
  // comment explains why) — checked separately, task 6.11/6.12.
  const agreed = z
    .object({ agreeToTerms: z.literal(true) })
    .safeParse(input).success;
  if (!agreed) {
    return { ok: false, fieldErrors: { agreeToTerms: t("agreeRequired") } };
  }

  const { count } = await db.user.updateMany({
    where: { id: user.id, onboardingCompletedAt: null },
    data: {
      ...profileToUserData(parsed.data),
      elo: startingElo(parsed.data.selfRatedNtrp),
      onboardingCompletedAt: new Date(),
      consentedAt: new Date(),
      consentVersion: CURRENT_CONSENT_VERSION,
    },
  });
  // Only a first-time completion is a signup, not a no-op resubmit (the
  // comment above: calling this again writes nothing).
  if (count > 0) {
    await captureEvent("signup_completed", user.id, {});
  }

  redirect("/");
}
