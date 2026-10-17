import { ChevronRightIcon } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { AvatarUpload } from "@/components/avatar-upload";
import { LanguageSwitcher } from "@/components/language-switcher";
import { MatchHistory } from "@/components/match-history";
import { MyGames } from "@/components/my-games";
import { ProfileHero } from "@/components/profile-hero";
import { requireOnboardedUser } from "@/lib/auth/require-onboarded-user";
import { getMyUpcomingGames } from "@/lib/offers/my-games";
import { getMatchHistory, summarizeMatches } from "@/lib/players/match-history";
import { getPublicProfile } from "@/lib/players/public-profile";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("ProfilePage");
  return { title: t("title") };
}

// The player's own profile (slice K6): the same hero other players see on
// /players/[id], then what only they need — their upcoming games, their
// match history, and account settings in one list. Built from
// getPublicProfile, so nothing private (the birth date) can slip into the
// shared hero.
export default async function ProfilePage() {
  const t = await getTranslations("ProfilePage");
  const player = await requireOnboardedUser();
  const [profile, matches, games] = await Promise.all([
    getPublicProfile(player.id),
    getMatchHistory(player.id),
    getMyUpcomingGames(player.id),
  ]);
  // requireOnboardedUser has just checked the profile is complete.
  if (!profile) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-4 py-8">
      <ProfileHero profile={profile} summary={summarizeMatches(matches)} />

      <Card title={t("myGames")}>
        <MyGames games={games} />
      </Card>

      <Card title={t("matchHistory")}>
        <MatchHistory matches={matches} />
      </Card>

      <Card title={t("account")}>
        <div className="pb-4">
          <p className="mb-2 text-sm font-medium">{t("photo")}</p>
          <AvatarUpload userId={profile.id} />
        </div>
        <ul className="divide-y border-t">
          <SettingsLink href="/profile/edit">{t("editProfile")}</SettingsLink>
          <SettingsLink href="/profile/notifications">
            {t("notifications")}
          </SettingsLink>
          <SettingsLink href="/profile/export">{t("exportData")}</SettingsLink>
          <li className="flex items-center justify-between py-3">
            <span>{t("language")}</span>
            <LanguageSwitcher />
          </li>
          <SettingsLink href="/profile/delete" destructive>
            {t("deleteAccount")}
          </SettingsLink>
        </ul>
      </Card>
    </main>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border bg-card px-5 py-4 shadow-sm">
      <h2 className="mb-2 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function SettingsLink({
  href,
  destructive = false,
  children,
}: {
  href: string;
  destructive?: boolean;
  children: ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        className={cn(
          "flex items-center justify-between py-3 outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring",
          destructive && "text-destructive hover:text-destructive",
        )}
      >
        {children}
        <ChevronRightIcon
          aria-hidden
          className="size-4 text-muted-foreground"
        />
      </Link>
    </li>
  );
}
