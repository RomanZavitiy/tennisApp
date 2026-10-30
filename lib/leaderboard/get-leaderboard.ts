import { db } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import type { District } from "@/lib/generated/prisma/enums";
import { computeReliability, type Reliability } from "@/lib/rating/reliability";
import {
  NTRP_BANDS,
  type LeaderboardFilters,
} from "@/lib/validation/leaderboard";

// The leaderboard (task L.1-L.2): a read-only ranking of onboarded, unblocked
// players by current ELO — no Season model, no challenges (decision
// 2026-10-30). Capped at the top 100: a ladder with more rows than that stops
// being useful to scroll, and nobody below it was going to be found anyway.

export const LEADERBOARD_SIZE = 100;

export type LeaderboardPlayer = {
  id: string;
  name: string | null;
  avatarPath: string | null;
  district: District | null;
  elo: number;
  matchesPlayed: number;
  reliability: Reliability;
};

const leaderboardSelect = {
  id: true,
  name: true,
  avatarPath: true,
  district: true,
  elo: true,
  matchesPlayed: true,
  scheduledMatches: true,
  noShows: true,
  lateCancellations: true,
} as const;

type LeaderboardRow = {
  id: string;
  name: string | null;
  avatarPath: string | null;
  district: District | null;
  elo: number | null;
  matchesPlayed: number;
  scheduledMatches: number;
  noShows: number;
  lateCancellations: number;
};

function toLeaderboardPlayer(row: LeaderboardRow): LeaderboardPlayer {
  return {
    id: row.id,
    name: row.name,
    avatarPath: row.avatarPath,
    district: row.district,
    // Never null here: the query below only selects users with elo set.
    elo: row.elo as number,
    matchesPlayed: row.matchesPlayed,
    reliability: computeReliability(row),
  };
}

export async function getLeaderboard(
  filters: LeaderboardFilters = {},
): Promise<LeaderboardPlayer[]> {
  const conditions: Prisma.UserWhereInput[] = [
    { onboardingCompletedAt: { not: null } },
    { blockedAt: null },
    // A CHECK guarantees elo is set for every onboarded user (decision
    // "ELO лише для синґлів", task 4.2), but the column itself is nullable —
    // filter on it directly rather than trust that in the type.
    { elo: { not: null } },
  ];

  if (filters.district) {
    conditions.push({ district: filters.district });
  }
  if (filters.level) {
    const band = NTRP_BANDS[filters.level];
    conditions.push({ selfRatedNtrp: { gte: band.min, lte: band.max } });
  }

  const rows = await db.user.findMany({
    where: { AND: conditions },
    orderBy: [{ elo: "desc" }, { id: "asc" }],
    select: leaderboardSelect,
    take: LEADERBOARD_SIZE,
  });

  return rows.map(toLeaderboardPlayer);
}
