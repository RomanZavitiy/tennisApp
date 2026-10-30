import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { connection } from "next/server";

import { LeaderboardFiltersForm } from "@/components/leaderboard-filters";
import { LeaderboardRow } from "@/components/leaderboard-row";
import { getLeaderboard } from "@/lib/leaderboard/get-leaderboard";
import { parseLeaderboardFilters } from "@/lib/validation/leaderboard";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("LeaderboardPage");
  return { title: t("title") };
}

// The leaderboard (task L.1-L.4): a read-only ranking of onboarded, unblocked
// players by current ELO, filterable by district and NTRP band — no Season
// model, no challenges (decision 2026-10-30). The filters live in the URL
// (/leaderboard?district=…&level=…), the same approach as the offer feed's.
export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // ELO changes as results are confirmed; never serve a page built earlier.
  await connection();
  const params = await searchParams;
  const filters = parseLeaderboardFilters(params);
  const players = await getLeaderboard(filters);
  const filtered = Object.keys(filters).length > 0;
  const t = await getTranslations("LeaderboardPage");

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>

      <LeaderboardFiltersForm filters={filters} />

      {players.length === 0 ? (
        <p className="mt-6 text-muted-foreground">
          {filtered ? t("noneMatchFilters") : t("noPlayersYet")}
        </p>
      ) : (
        <ol className="mt-6 space-y-3">
          {players.map((player, index) => (
            <li key={player.id}>
              <LeaderboardRow rank={index + 1} player={player} />
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
