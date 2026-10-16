import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { completeOnboarding } from "@/app/onboarding/actions";
import { ProfileForm } from "@/components/profile-form";
import { requireUser } from "@/lib/auth/require-user";
import { db } from "@/lib/db";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("OnboardingPage");
  return { title: t("title") };
}

// The proxy already sends signed-out visitors to /login. Someone who has
// finished onboarding has nothing to do here.
export default async function OnboardingPage() {
  const t = await getTranslations("OnboardingPage");
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
      <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="mt-2 mb-6 text-muted-foreground">{t("subtitle")}</p>
      <ProfileForm
        action={completeOnboarding}
        submitLabel={t("submit")}
        withConsent
      />
    </main>
  );
}
