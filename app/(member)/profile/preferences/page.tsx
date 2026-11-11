import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { SplitShell } from "@/components/page-shell";
import { PlayPreferencesForm } from "@/components/play-preferences-form";
import { buttonVariants } from "@/components/ui/button";
import { requireOnboardedUser } from "@/lib/auth/require-onboarded-user";
import { db } from "@/lib/db";
import type { TimeOfDay } from "@/lib/offers/feed-filters";
import type { Weekday } from "@/lib/profile/options";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("PlayPreferencesPage");
  return { title: t("title") };
}

// "Коли я люблю грати" (slice U1, task U1.2) — its own settings page, same
// split as /profile/notifications: these aren't part of
// requireOnboardedUser()'s own select, so this page reads them itself.
export default async function PlayPreferencesPage() {
  const user = await requireOnboardedUser();
  const preferences = await db.user.findUniqueOrThrow({
    where: { id: user.id },
    select: {
      preferredDays: true,
      preferredTimes: true,
      preferredDistricts: true,
    },
  });
  const t = await getTranslations("PlayPreferencesPage");

  return (
    <SplitShell>
      <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
      <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      <div className="mt-6">
        <PlayPreferencesForm
          preferences={{
            // Stored as plain text[] columns — cast once here, same as
            // lib/notifications/new-offer.ts's own toCandidate.
            preferredDays: preferences.preferredDays as Weekday[],
            preferredTimes: preferences.preferredTimes as TimeOfDay[],
            preferredDistricts: preferences.preferredDistricts,
          }}
          ownDistrict={user.district}
        />
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
