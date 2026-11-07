import { captureEvent } from "@/lib/analytics/posthog";
import { db } from "@/lib/db";
import { toKrakowLocal } from "@/lib/offers/krakow-time";
import {
  getMatchHistory,
  type MatchHistoryEntry,
} from "@/lib/players/match-history";
import { computeReliability, type Reliability } from "@/lib/rating/reliability";

// Achievements (slice W, owner decision 2026-11-07): computed from existing
// counters and match_results, no new table -- a page view (or the check
// after a confirmation) recomputes the list fresh every time, so there's
// nothing to keep in sync and nothing to migrate if a rule ever changes.

export type AchievementId =
  | "FIRST_MATCH"
  | "MATCHES_10"
  | "MATCHES_25"
  | "MATCHES_50"
  | "RELIABLE"
  | "FIVE_OPPONENTS"
  | "REGULAR_MONTH";

const MATCH_MILESTONES: readonly { id: AchievementId; count: number }[] = [
  { id: "MATCHES_10", count: 10 },
  { id: "MATCHES_25", count: 25 },
  { id: "MATCHES_50", count: 50 },
];

/** A calendar month (Europe/Warsaw) with at least this many confirmed matches. */
export const REGULAR_MONTH_MATCHES = 4;

export type AchievementCounts = {
  matchesPlayed: number;
  reliability: Reliability;
  distinctOpponents: number;
  hasRegularMonth: boolean;
};

/** Pure rule evaluation, kept apart from the query so each rule has its own test. */
export function computeAchievements(
  counts: AchievementCounts,
): AchievementId[] {
  const unlocked: AchievementId[] = [];
  if (counts.matchesPlayed >= 1) {
    unlocked.push("FIRST_MATCH");
  }
  for (const { id, count } of MATCH_MILESTONES) {
    if (counts.matchesPlayed >= count) {
      unlocked.push(id);
    }
  }
  if (counts.reliability.kind === "rated" && counts.reliability.percent >= 95) {
    unlocked.push("RELIABLE");
  }
  if (counts.distinctOpponents >= 5) {
    unlocked.push("FIVE_OPPONENTS");
  }
  if (counts.hasRegularMonth) {
    unlocked.push("REGULAR_MONTH");
  }
  return unlocked;
}

/**
 * "Regular month" (task W.4): true once any one Europe/Warsaw calendar
 * month has REGULAR_MONTH_MATCHES or more confirmed matches in it.
 */
export function hasRegularMonth(matchStartTimes: readonly Date[]): boolean {
  const countByMonth = new Map<string, number>();
  for (const date of matchStartTimes) {
    const monthKey = toKrakowLocal(date).slice(0, 7); // "YYYY-MM"
    countByMonth.set(monthKey, (countByMonth.get(monthKey) ?? 0) + 1);
  }
  return [...countByMonth.values()].some(
    (count) => count >= REGULAR_MONTH_MATCHES,
  );
}

function countsFromMatches(
  matchesPlayed: number,
  reliabilityCounts: {
    scheduledMatches: number;
    noShows: number;
    lateCancellations: number;
  },
  matches: readonly MatchHistoryEntry[],
): AchievementCounts {
  return {
    matchesPlayed,
    reliability: computeReliability(reliabilityCounts),
    distinctOpponents: new Set(matches.map((match) => match.opponentId)).size,
    hasRegularMonth: hasRegularMonth(matches.map((match) => match.startsAt)),
  };
}

/** The achievements to show on `userId`'s profile (task W.4), public either way. */
export async function getPlayerAchievements(
  userId: string,
): Promise<AchievementId[]> {
  const [user, matches] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: {
        matchesPlayed: true,
        scheduledMatches: true,
        noShows: true,
        lateCancellations: true,
      },
    }),
    getMatchHistory(userId),
  ]);
  if (!user) {
    return [];
  }
  return computeAchievements(
    countsFromMatches(user.matchesPlayed, user, matches),
  );
}

/**
 * The achievements `userId` newly unlocked by `matchResultId` being
 * confirmed just now (task W.4's analytics) -- "before" is the same data
 * with that one match excluded and matchesPlayed one lower; reliability
 * isn't affected by a confirmation, so it's identical on both sides.
 */
export async function newlyUnlockedAchievements(
  userId: string,
  matchResultId: string,
): Promise<AchievementId[]> {
  const [user, matches] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: {
        matchesPlayed: true,
        scheduledMatches: true,
        noShows: true,
        lateCancellations: true,
      },
    }),
    getMatchHistory(userId),
  ]);
  if (!user) {
    return [];
  }

  const after = computeAchievements(
    countsFromMatches(user.matchesPlayed, user, matches),
  );
  const priorMatches = matches.filter((match) => match.id !== matchResultId);
  const before = computeAchievements(
    countsFromMatches(user.matchesPlayed - 1, user, priorMatches),
  );
  return after.filter((id) => !before.includes(id));
}

/**
 * Fires `achievement_unlocked` for whichever side of a just-confirmed
 * match newly crossed a threshold -- the only two call sites that change
 * `matchesPlayed` (confirmResult, 4.7, and the auto-confirm cron, 5.8), so
 * this is the only place that needs to know about the analytics event.
 * Never throws: a match is confirmed and ELO moves either way, the same
 * stance captureEvent itself takes for the underlying PostHog call.
 */
export async function notifyNewAchievements(
  authorId: string,
  playerId: string,
  matchResultId: string,
): Promise<void> {
  for (const userId of [authorId, playerId]) {
    try {
      const unlocked = await newlyUnlockedAchievements(userId, matchResultId);
      for (const id of unlocked) {
        await captureEvent("achievement_unlocked", userId, { id });
      }
    } catch (error) {
      console.error(`Couldn't compute achievements for ${userId}:`, error);
    }
  }
}
