import { db } from "@/lib/db";
import type { FeedbackTag } from "@/lib/generated/prisma/enums";

// A feedback tag becomes a public badge only once enough *different*
// players gave it (owner decision 2026-11-07): an individual row, and who
// gave it, is never shown to anyone -- only this aggregate is public.

export const BADGE_THRESHOLD = 5;

export type FeedbackTagCounts = Partial<Record<FeedbackTag, number>>;

/** Pure threshold check, kept apart from the query so it has its own test. */
export function computeBadges(counts: FeedbackTagCounts): FeedbackTag[] {
  return (Object.entries(counts) as [FeedbackTag, number][])
    .filter(([, count]) => count >= BADGE_THRESHOLD)
    .map(([tag]) => tag);
}

/**
 * Distinct givers per tag for `receiverId` -- "different players", not rows:
 * the same giver could tag the same opponent again across a replayed match.
 */
async function getDistinctGiverCountsByTag(
  receiverId: string,
): Promise<FeedbackTagCounts> {
  const rows = await db.matchFeedback.findMany({
    where: { receiverId },
    select: { giverId: true, tags: true },
  });

  const giversByTag = new Map<FeedbackTag, Set<string>>();
  for (const row of rows) {
    for (const tag of row.tags) {
      const givers = giversByTag.get(tag) ?? new Set<string>();
      givers.add(row.giverId);
      giversByTag.set(tag, givers);
    }
  }

  const counts: FeedbackTagCounts = {};
  for (const [tag, givers] of giversByTag) {
    counts[tag] = givers.size;
  }
  return counts;
}

/** The public badges to show on `receiverId`'s profile (task W.2). */
export async function getPublicBadges(
  receiverId: string,
): Promise<FeedbackTag[]> {
  return computeBadges(await getDistinctGiverCountsByTag(receiverId));
}
