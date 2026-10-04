import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { completeOnboarding } from "@/app/onboarding/actions";
import { ProfileForm } from "@/components/profile-form";
import { requireUser } from "@/lib/auth/require-user";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Set up your profile" };

// The proxy already sends signed-out visitors to /login. Someone who has
// finished onboarding has nothing to do here.
export default async function OnboardingPage() {
  const user = await requireUser();
  const row = await db.user.findUnique({
    where: { id: user.id },
    select: { onboardingCompletedAt: true },
  });
  if (row?.onboardingCompletedAt) {
    redirect("/");
  }

  return (
    <main className="mx-auto w-full max-w-sm flex-1 px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">
        Set up your profile
      </h1>
      <p className="mt-2 mb-6 text-muted-foreground">
        Other players see this when you post or join a sparring offer.
      </p>
      <ProfileForm action={completeOnboarding} submitLabel="Save profile" />
    </main>
  );
}
