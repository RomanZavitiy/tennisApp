import { TrophyIcon } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { connection } from "next/server";

import { EmptyState } from "@/components/empty-state";
import { LeaderboardFiltersForm } from "@/components/leaderboard-filters";
import { LeaderboardRow } from "@/components/leaderboard-row";
import { ListingLayout, PageHeader, PageShell } from "@/components/page-shell";
import { getCurrentUser } from "@/lib/auth/require-user";
import { getLeaderboard } from "@/lib/leaderboard/get-leaderboard";
import { getMyOpenOffers } from "@/lib/offers/my-open-offers";
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
  // "Invite to game" (task S1.4): the same list of the viewer's own open
  // offers on every row — loaded once, not per player.
  const viewer = await getCurrentUser();
  const myOpenOffers = viewer ? await getMyOpenOffers(viewer.id) : null;

  return (
    <PageShell>
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
      />

      <ListingLayout sidebar={<LeaderboardFiltersForm filters={filters} />}>
        {players.length === 0 ? (
          <EmptyState icon={<TrophyIcon />}>
            {filtered ? t("noneMatchFilters") : t("noPlayersYet")}
          </EmptyState>
        ) : (
          <ol className="space-y-3">
            {players.map((player, index) => (
              <li key={player.id}>
                <LeaderboardRow
                  rank={index + 1}
                  player={player}
                  myOpenOffers={
                    viewer && viewer.id !== player.id ? myOpenOffers : null
                  }
                />
              </li>
            ))}
          </ol>
        )}
      </ListingLayout>
    </PageShell>
  );
}
