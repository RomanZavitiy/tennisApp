"use server";

import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/require-user";
import { db } from "@/lib/db";
import {
  profileFieldErrors,
  profileSchema,
  profileToUserData,
  type SaveProfileResult,
} from "@/lib/validation/profile";

// Saves the onboarding form. The schema runs again here because a request can
// skip the browser's checks; on failure the first message per field goes back
// to the form, on success the user lands on the home page.
export async function completeOnboarding(
  input: unknown,
): Promise<SaveProfileResult> {
  const user = await requireUser();

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return profileFieldErrors(parsed.error);
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      ...profileToUserData(parsed.data),
      onboardingCompletedAt: new Date(),
    },
  });

  redirect("/");
}
