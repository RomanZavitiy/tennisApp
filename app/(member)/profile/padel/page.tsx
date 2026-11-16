import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { PadelProfileForm } from "@/components/padel-profile-form";
import { SplitShell } from "@/components/page-shell";
import { buttonVariants } from "@/components/ui/button";
import { requireOnboardedUser } from "@/lib/auth/require-onboarded-user";
import { db } from "@/lib/db";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("PadelProfilePage");
  return { title: t("title") };
}

// "My padel" (slice PD2): the level and the side a padel game is matched
// by. Its own settings page, like /profile/preferences — optional, so it
// stays out of onboarding and of the tennis profile form.
export default async function PadelProfilePage() {
  const user = await requireOnboardedUser();
  const padel = await db.user.findUniqueOrThrow({
    where: { id: user.id },
    select: { padelLevel: true, padelSide: true },
  });
  const t = await getTranslations("PadelProfilePage");

  return (
    <SplitShell>
      <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
      <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      <div className="mt-6">
        <PadelProfileForm padel={padel} />
      </div>
      <Link
        href="/profile"
        className={buttonVariants({
          variant: "outline",
          className: "mt-8 w-full",
        })}
      >
        {t("backToProfile")}
      </Link>
    </SplitShell>
  );
}
