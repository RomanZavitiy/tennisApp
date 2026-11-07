import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { reportPlayer } from "@/app/players/[id]/actions";
import { BlockPlayerButton } from "@/components/block-player-button";
import { InvitePlayerButton } from "@/components/invite-player-button";
import { MatchHistory } from "@/components/match-history";
import { PlayerBadges } from "@/components/player-badges";
import { ProfileHero } from "@/components/profile-hero";
import { ReportButton } from "@/components/report-button";
import { getPlayerAchievements } from "@/lib/achievements/achievements";
import { getCurrentUser } from "@/lib/auth/require-user";
import { getPublicBadges } from "@/lib/feedback/badges";
import { isBlocked } from "@/lib/moderation/personal-block";
import { getMyOpenOffers } from "@/lib/offers/my-open-offers";
import { getMatchHistory, summarizeMatches } from "@/lib/players/match-history";
import { getPublicProfile } from "@/lib/players/public-profile";

// A player's public page — open to everyone, signed in or not (it's in the
// proxy's public list). Only what getPublicProfile returns can appear here.

// Typed by hand: Next's generated PageProps exist only after `next typegen`,
// and CI lints before that.
type PlayerPageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({
  params,
}: PlayerPageProps): Promise<Metadata> {
  const t = await getTranslations("PlayerPage");
  const profile = await getPublicProfile((await params).id);
  return { title: profile?.name ?? t("notFound") };
}

export default async function PlayerPage({ params }: PlayerPageProps) {
  const { id } = await params;
  const profile = await getPublicProfile(id);
  if (!profile) {
    notFound();
  }
  const [matches, achievements, feedbackBadges] = await Promise.all([
    getMatchHistory(id),
    getPlayerAchievements(id),
    getPublicBadges(id),
  ]);
  const viewer = await getCurrentUser();
  const t = await getTranslations("PlayerPage");
  const isOwnProfile = viewer?.id === profile.id;
  const alreadyBlocked =
    viewer && !isOwnProfile ? await isBlocked(viewer.id, profile.id) : false;
  // "Invite to game" (task S1.4): the viewer's own open offers to invite
  // this player into.
  const myOpenOffers =
    viewer && !isOwnProfile ? await getMyOpenOffers(viewer.id) : null;

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-4 py-8">
      {/* The same hero as the player's own /profile (slice K6). */}
      <ProfileHero profile={profile} summary={summarizeMatches(matches)} />
      <PlayerBadges
        achievements={achievements}
        feedbackBadges={feedbackBadges}
      />
      <section className="rounded-2xl border bg-card px-5 py-4 shadow-sm">
        <h2 className="mb-2 text-lg font-semibold">{t("matchHistory")}</h2>
        <MatchHistory matches={matches} />
      </section>
      {viewer && !isOwnProfile && (
        <div className="space-y-3">
          <InvitePlayerButton
            targetUserId={profile.id}
            offers={myOpenOffers ?? []}
            source="profile"
          />
          <div className="flex flex-wrap items-center gap-3">
            <ReportButton
              action={reportPlayer.bind(null, profile.id)}
              label={t("reportThisPlayer")}
            />
            <BlockPlayerButton
              targetUserId={profile.id}
              initialBlocked={alreadyBlocked}
            />
          </div>
        </div>
      )}
    </main>
  );
}
