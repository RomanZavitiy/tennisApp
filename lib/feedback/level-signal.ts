import { db } from "@/lib/db";
import type { LevelSignal } from "@/lib/generated/prisma/enums";

// "This player's level felt higher/lower than their declared NTRP" (owner
// decision 2026-11-07): stored per feedback row, but shown only privately
// to the player themselves, as a hint, once enough different opponents
// agree -- it never changes NTRP or ELO automatically in v1.

export const LEVEL_SIGNAL_THRESHOLD = 3;

export type LevelSignalCounts = { higher: number; lower: number };

/**
 * Pure threshold/tie-break logic, kept apart from the query so it has its
 * own test. Ties (both sides reach the threshold) favour whichever signal
 * more opponents gave -- an exact tie shows the higher-level hint, which is
 * at least as plausible as any other arbitrary choice.
 */
export function computeLevelHint(
  counts: LevelSignalCounts,
): LevelSignal | null {
  const higherQualifies = counts.higher >= LEVEL_SIGNAL_THRESHOLD;
  const lowerQualifies = counts.lower >= LEVEL_SIGNAL_THRESHOLD;
  if (higherQualifies && lowerQualifies) {
    return counts.higher >= counts.lower ? "HIGHER" : "LOWER";
  }
  if (higherQualifies) {
    return "HIGHER";
  }
  if (lowerQualifies) {
    return "LOWER";
  }
  return null;
}

/** The private level-signal hint for `userId`'s own profile (task W.3). */
export async function getLevelHint(
  userId: string,
): Promise<LevelSignal | null> {
  const rows = await db.matchFeedback.findMany({
    where: { receiverId: userId, levelSignal: { not: null } },
    select: { giverId: true, levelSignal: true },
  });

  const higher = new Set<string>();
  const lower = new Set<string>();
  for (const row of rows) {
    if (row.levelSignal === "HIGHER") {
      higher.add(row.giverId);
    } else if (row.levelSignal === "LOWER") {
      lower.add(row.giverId);
    }
  }
  return computeLevelHint({ higher: higher.size, lower: lower.size });
}
