import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";

import { giveConsent } from "@/app/consent/actions";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/require-user";
import { db } from "@/lib/db";
import { needsConsent } from "@/lib/legal/consent";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("ConsentPage");
  return { title: t("title") };
}

// Only for an already-onboarded user whose consent is missing or out of
// date (requireOnboardedUser sends them here) — a brand-new user agrees
// inside /onboarding itself and never reaches this page in the first place.
export default async function ConsentPage() {
  const user = await requireUser();
  const row = await db.user.findUnique({
    where: { id: user.id },
    select: { onboardingCompletedAt: true, consentVersion: true },
  });
  if (!row?.onboardingCompletedAt) {
    redirect("/onboarding");
  }
  if (!needsConsent(row.consentVersion)) {
    redirect("/");
  }

  const t = await getTranslations("ConsentPage");

  return (
    <main className="mx-auto w-full max-w-sm flex-1 px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="mt-2 mb-6 text-muted-foreground">
        {t.rich("body", {
          terms: (chunks) => (
            <Link
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              {chunks}
            </Link>
          ),
          privacy: (chunks) => (
            <Link
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              {chunks}
            </Link>
          ),
        })}
      </p>
      <form action={giveConsent}>
        <Button type="submit" className="w-full">
          {t("agree")}
        </Button>
      </form>
    </main>
  );
}
