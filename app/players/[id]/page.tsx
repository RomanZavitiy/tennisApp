import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MatchHistory } from "@/components/match-history";
import { PlayerAvatar } from "@/components/player-avatar";
import { PlayerFacts } from "@/components/player-facts";
import { getMatchHistory } from "@/lib/players/match-history";
import { getPublicProfile } from "@/lib/players/public-profile";

// A player's public page — open to everyone, signed in or not (it's in the
// proxy's public list). Only what getPublicProfile returns can appear here.

// Typed by hand: Next's generated PageProps exist only after `next typegen`,
// and CI lints before that.
type PlayerPageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({
  params,
}: PlayerPageProps): Promise<Metadata> {
  const profile = await getPublicProfile((await params).id);
  return { title: profile?.name ?? "Player not found" };
}

export default async function PlayerPage({ params }: PlayerPageProps) {
  const { id } = await params;
  const profile = await getPublicProfile(id);
  if (!profile) {
    notFound();
  }
  const matches = await getMatchHistory(id);

  return (
    <main className="mx-auto w-full max-w-sm flex-1 px-4 py-10">
      <div className="flex items-center gap-4">
        <PlayerAvatar name={profile.name} avatarPath={profile.avatarPath} />
        <h1 className="text-2xl font-semibold tracking-tight">
          {profile.name}
        </h1>
      </div>
      <div className="mt-6">
        <PlayerFacts
          age={profile.age}
          district={profile.district}
          selfRatedNtrp={profile.selfRatedNtrp}
          elo={profile.elo}
          reliability={profile.reliability}
        />
      </div>
      <div className="mt-8">
        <h2 className="font-semibold">Match history</h2>
        <div className="mt-3">
          <MatchHistory matches={matches} />
        </div>
      </div>
    </main>
  );
}
