"use server";

import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/require-user";
import { db } from "@/lib/db";
import { profileSchema, type ProfileInput } from "@/lib/validation/profile";

export type SaveProfileResult = {
  ok: false;
  fieldErrors: Partial<Record<keyof ProfileInput, string>>;
};

// Saves the onboarding form. The schema runs again here because a request can
// skip the browser's checks; on failure the first message per field goes back
// to the form, on success the user lands on the home page.
export async function completeOnboarding(
  input: unknown,
): Promise<SaveProfileResult> {
  const user = await requireUser();

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: SaveProfileResult["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      // A request that isn't an object at all has no field to attach to;
      // the form never sends one, so it only gets `ok: false`.
      const field = issue.path[0];
      if (typeof field === "string" && field in profileSchema.shape) {
        fieldErrors[field as keyof ProfileInput] ??= issue.message;
      }
    }
    return { ok: false, fieldErrors };
  }

  const { birthDate, ...profile } = parsed.data;
  await db.user.update({
    where: { id: user.id },
    data: {
      ...profile,
      // A date column: midnight UTC of that calendar day stores exactly it.
      birthDate: new Date(`${birthDate}T00:00:00Z`),
      onboardingCompletedAt: new Date(),
    },
  });

  redirect("/");
}
