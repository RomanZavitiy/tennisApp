import { ChevronRightIcon } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { submitFeedback } from "@/app/(member)/profile/feedback-actions";
import { AvatarUpload } from "@/components/avatar-upload";
import { BlockedPlayersList } from "@/components/blocked-players-list";
import { DiscoverableToggle } from "@/components/discoverable-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LevelHint } from "@/components/level-hint";
import { MatchHistory } from "@/components/match-history";
import { MyBookings } from "@/components/my-bookings";
import { MyGames } from "@/components/my-games";
import { PendingFeedbackPrompt } from "@/components/pending-feedback-prompt";
import { PlayerBadges } from "@/components/player-badges";
import { ProfileHero } from "@/components/profile-hero";
import { getPlayerAchievements } from "@/lib/achievements/achievements";
import { requireOnboardedUser } from "@/lib/auth/require-onboarded-user";
import { getMyBookings } from "@/lib/booking/my-bookings";
import { db } from "@/lib/db";
import { getPublicBadges } from "@/lib/feedback/badges";
import { getLevelHint } from "@/lib/feedback/level-signal";
import { getPendingFeedback } from "@/lib/feedback/match-feedback";
import { getBlockedPlayers } from "@/lib/moderation/personal-block";
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
  const [
    profile,
    matches,
    games,
    bookings,
    blockedPlayers,
    settings,
    achievements,
    feedbackBadges,
    levelHint,
  ] = await Promise.all([
    getPublicProfile(player.id),
    getMatchHistory(player.id),
    getMyUpcomingGames(player.id),
    getMyBookings(player.id),
    getBlockedPlayers(player.id),
    db.user.findUniqueOrThrow({
      where: { id: player.id },
      select: { discoverable: true },
    }),
    getPlayerAchievements(player.id),
    getPublicBadges(player.id),
    getLevelHint(player.id),
  ]);
  // requireOnboardedUser has just checked the profile is complete.
  if (!profile) {
    notFound();
  }
  const pendingFeedback = await getPendingFeedback(player.id, matches);
  const pendingFeedbackIds = new Set(
    pendingFeedback.map((item) => item.matchResultId),
  );

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-4 py-8">
      <ProfileHero profile={profile} summary={summarizeMatches(matches)} />
      <PlayerBadges
        achievements={achievements}
        feedbackBadges={feedbackBadges}
      />
      <LevelHint hint={levelHint} />

      <Card title={t("myGames")}>
        <MyGames games={games} />
      </Card>

      {pendingFeedback.length > 0 && (
        <Card title={t("rateYourOpponent")}>
          <PendingFeedbackPrompt
            pending={pendingFeedback}
            action={submitFeedback}
          />
        </Card>
      )}

      <Card title={t("myBookings")}>
        <MyBookings upcoming={bookings.upcoming} past={bookings.past} />
      </Card>

      <Card title={t("matchHistory")}>
        <MatchHistory
          matches={matches}
          feedback={{ eligibleIds: pendingFeedbackIds, action: submitFeedback }}
        />
      </Card>

      <Card title={t("blockedPlayers")}>
        <BlockedPlayersList players={blockedPlayers} />
      </Card>

      <Card title={t("privacy")}>
        <DiscoverableToggle discoverable={settings.discoverable} />
      </Card>

      <Card title={t("account")}>
        <div className="pb-4">
          <p className="mb-2 text-sm font-medium">{t("photo")}</p>
          <AvatarUpload userId={profile.id} />
        </div>
        <ul className="divide-y border-t">
          <SettingsLink href="/profile/edit">{t("editProfile")}</SettingsLink>
          <SettingsLink href="/profile/preferences">
            {t("playPreferences")}
          </SettingsLink>
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
