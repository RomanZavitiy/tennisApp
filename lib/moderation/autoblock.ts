import { db } from "@/lib/db";

// Autoblock (task 6.4, decision 2026-10-14): 3 reports from different users
// within 30 days blocks the reported player until an admin decides —
// counting every report against them regardless of status (even a later-
// dismissed report already showed three people independently flagged this
// player) and regardless of context (direct, via an offer, or via a
// message — Report.targetUserId is always the same player either way).

export const AUTOBLOCK_THRESHOLD = 3;
export const AUTOBLOCK_WINDOW_DAYS = 30;

/** Pure threshold check, so the boundary itself has a test without a database. */
export function shouldAutoblock(distinctReporterCount: number): boolean {
  return distinctReporterCount >= AUTOBLOCK_THRESHOLD;
}

/**
 * Called after a report is filed (lib/moderation/create-report.ts): blocks
 * `targetUserId` if the threshold is now met and they aren't already
 * blocked. The guarded `updateMany` (blockedAt: null) makes two reports
 * landing at nearly the same moment log at most one AUTOBLOCK_PLAYER
 * action, even though the count query just before it isn't in the same
 * transaction — a player already blocked by the time this runs is simply
 * left as is, whatever blocked them first.
 */
export async function maybeAutoblock(
  targetUserId: string,
  now: Date = new Date(),
): Promise<void> {
  const windowStart = new Date(
    now.getTime() - AUTOBLOCK_WINDOW_DAYS * 86_400_000,
  );
  const reporters = await db.report.findMany({
    where: { targetUserId, createdAt: { gte: windowStart } },
    select: { reporterId: true },
    distinct: ["reporterId"],
  });
  if (!shouldAutoblock(reporters.length)) {
    return;
  }

  const { count } = await db.user.updateMany({
    where: { id: targetUserId, blockedAt: null },
    data: { blockedAt: now },
  });
  if (count === 0) {
    return;
  }
  await db.adminAction.create({
    data: { action: "AUTOBLOCK_PLAYER", targetUserId, adminId: null },
  });
}
