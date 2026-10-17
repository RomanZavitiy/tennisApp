import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { reportPlayer } from "@/app/players/[id]/actions";
import { MatchHistory } from "@/components/match-history";
import { ProfileHero } from "@/components/profile-hero";
import { ReportButton } from "@/components/report-button";
import { getCurrentUser } from "@/lib/auth/require-user";
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
  const matches = await getMatchHistory(id);
  const viewer = await getCurrentUser();
  const t = await getTranslations("PlayerPage");

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-4 py-8">
      {/* The same hero as the player's own /profile (slice K6). */}
      <ProfileHero profile={profile} summary={summarizeMatches(matches)} />
      <section className="rounded-2xl border bg-card px-5 py-4 shadow-sm">
        <h2 className="mb-2 text-lg font-semibold">{t("matchHistory")}</h2>
        <MatchHistory matches={matches} />
      </section>
      {viewer && viewer.id !== profile.id && (
        <div>
          <ReportButton
            action={reportPlayer.bind(null, profile.id)}
            label={t("reportThisPlayer")}
          />
        </div>
      )}
    </main>
  );
}
