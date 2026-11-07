import { db } from "@/lib/db";
import type { FeedbackTag, LevelSignal } from "@/lib/generated/prisma/enums";
import {
  blockedCounterpartIds,
  isBlockedEitherWay,
} from "@/lib/moderation/personal-block";

// Post-match feedback (slice W, owner decision 2026-11-07): up to 3 tags
// plus a separate level signal, once per opponent per match, within 7 days
// of the result being CONFIRMED. Every DB access for the feature lives
// here, same discipline as lib/moderation/personal-block.ts for user_blocks.

export const FEEDBACK_WINDOW_DAYS = 7;
const FEEDBACK_WINDOW_MS = FEEDBACK_WINDOW_DAYS * 24 * 60 * 60 * 1000;

/**
 * The last moment feedback can still be given for a result confirmed at
 * `confirmedAt` -- a result's status moves to CONFIRMED exactly once and
 * never changes afterwards, so `matchResult.updatedAt` at that moment *is*
 * the confirmation instant; no separate column needed (decisions.md).
 */
export function feedbackDeadline(confirmedAt: Date): Date {
  return new Date(confirmedAt.getTime() + FEEDBACK_WINDOW_MS);
}

export function isFeedbackWindowOpen(confirmedAt: Date, now: Date): boolean {
  return now.getTime() < feedbackDeadline(confirmedAt).getTime();
}

export type GivenFeedback = {
  tags: FeedbackTag[];
  levelSignal: LevelSignal | null;
};

/**
 * Feedback `giverId` already left for a set of matches -- one query for a
 * whole match-history page, not one per row.
 */
export async function getGivenFeedback(
  giverId: string,
  matchResultIds: string[],
): Promise<Map<string, GivenFeedback>> {
  if (matchResultIds.length === 0) {
    return new Map();
  }
  const rows = await db.matchFeedback.findMany({
    where: { giverId, matchResultId: { in: matchResultIds } },
    select: { matchResultId: true, tags: true, levelSignal: true },
  });
  return new Map(rows.map((row) => [row.matchResultId, row]));
}

export type SubmitFeedbackRefusal =
  | "MATCH_NOT_FOUND"
  | "NOT_PARTICIPANT"
  | "NOT_CONFIRMED"
  | "WINDOW_CLOSED"
  | "ALREADY_GIVEN"
  | "BLOCKED";

type SubmitFeedbackOutcome =
  { ok: true } | { ok: false; refusal: SubmitFeedbackRefusal };

/**
 * "Rate your opponent" (task W.1): only a participant of a CONFIRMED match,
 * only inside the 7-day window, only once per match, and never between
 * players who have blocked each other. `skipDuplicates` is the same
 * second-submission guard submitResult (4.6) uses for its own unique index.
 */
export async function submitMatchFeedback(
  matchResultId: string,
  giverId: string,
  input: { tags: FeedbackTag[]; levelSignal: LevelSignal | null },
  now: Date = new Date(),
): Promise<SubmitFeedbackOutcome> {
  const result = await db.matchResult.findUnique({
    where: { id: matchResultId },
    select: {
      status: true,
      updatedAt: true,
      offerJoin: {
        select: { userId: true, offer: { select: { authorId: true } } },
      },
    },
  });
  if (!result) {
    return { ok: false, refusal: "MATCH_NOT_FOUND" };
  }
  if (result.status !== "CONFIRMED") {
    return { ok: false, refusal: "NOT_CONFIRMED" };
  }

  const { userId, offer } = result.offerJoin;
  const receiverId =
    giverId === offer.authorId
      ? userId
      : giverId === userId
        ? offer.authorId
        : null;
  if (!receiverId) {
    return { ok: false, refusal: "NOT_PARTICIPANT" };
  }
  if (!isFeedbackWindowOpen(result.updatedAt, now)) {
    return { ok: false, refusal: "WINDOW_CLOSED" };
  }
  if (await isBlockedEitherWay(giverId, receiverId)) {
    return { ok: false, refusal: "BLOCKED" };
  }

  const created = await db.matchFeedback.createManyAndReturn({
    data: [
      {
        matchResultId,
        giverId,
        receiverId,
        tags: input.tags,
        levelSignal: input.levelSignal,
      },
    ],
    select: { id: true },
    skipDuplicates: true,
  });
  if (created.length === 0) {
    return { ok: false, refusal: "ALREADY_GIVEN" };
  }
  return { ok: true };
}

export type PendingFeedbackEntry = {
  matchResultId: string;
  opponentId: string;
  opponentName: string | null;
};

/**
 * The matches `userId` can still rate right now (task W.1's two entry
 * points, My games and match history): confirmed, inside the 7-day
 * window, not yet rated by this player, and not against a blocked
 * opponent either way.
 */
export async function getPendingFeedback(
  userId: string,
  matches: readonly {
    id: string;
    confirmedAt: Date;
    opponentId: string;
    opponentName: string | null;
  }[],
  now: Date = new Date(),
): Promise<PendingFeedbackEntry[]> {
  const withinWindow = matches.filter((match) =>
    isFeedbackWindowOpen(match.confirmedAt, now),
  );
  if (withinWindow.length === 0) {
    return [];
  }

  const [given, blockedIds] = await Promise.all([
    getGivenFeedback(
      userId,
      withinWindow.map((match) => match.id),
    ),
    blockedCounterpartIds(userId),
  ]);
  const blocked = new Set(blockedIds);

  return withinWindow
    .filter((match) => !given.has(match.id) && !blocked.has(match.opponentId))
    .map((match) => ({
      matchResultId: match.id,
      opponentId: match.opponentId,
      opponentName: match.opponentName,
    }));
}
