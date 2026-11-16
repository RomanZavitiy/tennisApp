import { db } from "@/lib/db";
import type {
  District,
  OfferFormat,
  Sport,
} from "@/lib/generated/prisma/enums";
import { blockedCounterpartIds } from "@/lib/moderation/personal-block";
import type { FeedFilters, TimeOfDay } from "@/lib/offers/feed-filters";
import { intentMatchesFilters } from "@/lib/offers/play-intent";
import { playerLevel } from "@/lib/sport/sport";

// "Шукають гру" (slice U2, task U2.2): every still-live intent, visible to
// any signed-in player (owner decision 2026-11-07) — the caller is
// responsible for that check (requireOnboardedUser), same split as every
// other feed. Small enough a list that this doesn't paginate, unlike the
// offer feed.

export type PlayIntentCard = {
  id: string;
  date: string;
  times: TimeOfDay[];
  districts: District[];
  format: OfferFormat;
  sport: Sport;
  note: string | null;
  user: {
    id: string;
    name: string | null;
    avatarPath: string | null;
    /** Their level in the intent's sport (slice PD2). */
    level: number | null;
  };
};

/**
 * Every live intent (not yet past its own calendar date), excluding
 * either side of a personal block (slice R), narrowed by the feed's own
 * filters (task U2.2's "ті самі фільтри"). `filters.sport` (slice PD2)
 * narrows to one sport — the pages pass the header switcher's.
 */
export async function getPlayIntentFeed(
  viewerId: string,
  filters: FeedFilters,
  now: Date = new Date(),
): Promise<PlayIntentCard[]> {
  const blockedIds = await blockedCounterpartIds(viewerId);

  const rows = await db.playIntent.findMany({
    where: {
      expiresAt: { gt: now },
      userId: { notIn: blockedIds },
      ...(filters.sport ? { sport: filters.sport } : {}),
    },
    orderBy: { date: "asc" },
    select: {
      id: true,
      date: true,
      times: true,
      districts: true,
      format: true,
      sport: true,
      note: true,
      user: {
        select: {
          id: true,
          name: true,
          avatarPath: true,
          selfRatedNtrp: true,
          padelLevel: true,
        },
      },
    },
  });

  const cards: PlayIntentCard[] = rows.map(({ user, ...row }) => ({
    ...row,
    date: row.date.toISOString().slice(0, 10),
    times: row.times as TimeOfDay[],
    user: {
      id: user.id,
      name: user.name,
      avatarPath: user.avatarPath,
      level: playerLevel(user, row.sport),
    },
  }));

  return cards.filter((intent) =>
    intentMatchesFilters(
      {
        date: intent.date,
        times: intent.times,
        districts: intent.districts,
        format: intent.format,
        sport: intent.sport,
        level: intent.user.level,
      },
      filters,
    ),
  );
}
