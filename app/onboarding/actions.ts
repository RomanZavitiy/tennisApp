"use server";

import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { captureEvent } from "@/lib/analytics/posthog";
import { requireUser } from "@/lib/auth/require-user";
import { db } from "@/lib/db";
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

  const { count } = await db.user.updateMany({
    where: { id: user.id, onboardingCompletedAt: null },
    data: {
      ...profileToUserData(parsed.data),
      elo: startingElo(parsed.data.selfRatedNtrp),
      onboardingCompletedAt: new Date(),
    },
  });
  // Only a first-time completion is a signup, not a no-op resubmit (the
  // comment above: calling this again writes nothing).
  if (count > 0) {
    await captureEvent("signup_completed", user.id, {});
  }

  redirect("/");
}
