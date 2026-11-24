import { db } from "@/lib/db";
import { notify } from "@/lib/notifications/notify";
import { doublesSideOf } from "@/lib/offers/doubles-result-rules";
import {
  lockDoublesResult,
  settleDoublesResult,
} from "@/lib/rating/apply-doubles";

// The doubles half of the cron's result jobs (slice PD4): auto-confirm after
// 72h (the singles twin is auto-confirm.ts) and the one "confirm the result"
// nudge after ~24h (reminders.ts). Same one-row-per-transaction discipline:
// a bad row can't block the batch, and a result a human settles in between
// is left alone because the lock re-checks PENDING.

const HOUR_MS = 3_600_000;

/** Settles every PENDING doubles result whose 72h window has passed. */
export async function autoConfirmExpiredDoublesResults(
  now: Date = new Date(),
): Promise<number> {
  const due = await db.doublesResult.findMany({
    where: { status: "PENDING", autoConfirmAt: { lte: now } },
    select: { id: true },
  });

  let settled = 0;
  for (const { id } of due) {
    const done = await db.$transaction(async (tx) => {
      const result = await lockDoublesResult(tx, id);
      if (!result || result.status !== "PENDING") {
        return false;
      }
      await settleDoublesResult(tx, result);
      return true;
    });
    if (done) {
      settled++;
    }
  }
  return settled;
}

/**
 * Who can still confirm or dispute a pending doubles result: the pair that
 * didn't file a score, or the one player a no-show report names — the
 * people `settleDoublesRefusal` lets through.
 */
export function doublesSettlerIds(result: {
  authorId: string;
  authorPartnerId: string | null;
  opponent1Id: string | null;
  opponent2Id: string | null;
  reportedById: string;
  noShowUserId: string | null;
}): string[] {
  if (result.noShowUserId) {
    return [result.noShowUserId];
  }
  const otherPair =
    doublesSideOf(result, result.reportedById) === "AUTHOR"
      ? [result.opponent1Id, result.opponent2Id]
      : [result.authorId, result.authorPartnerId];
  return otherPair.filter((id): id is string => id !== null);
}

/** Notifies everyone who can settle a just-filed or still-pending result. */
export async function notifyDoublesSettlers(
  result: Parameters<typeof doublesSettlerIds>[0] & { offerId: string },
  now: Date = new Date(),
): Promise<void> {
  for (const userId of doublesSettlerIds(result)) {
    await notify(
      userId,
      { kind: "CONFIRM_RESULT_REMINDER", offerId: result.offerId },
      now,
    );
  }
}

/** ~24h after filing, once, to whoever still hasn't settled it. */
export async function sendDoublesResultReminders(
  now: Date = new Date(),
): Promise<number> {
  const due = await db.doublesResult.findMany({
    where: {
      status: "PENDING",
      resultReminderSentAt: null,
      createdAt: { lte: new Date(now.getTime() - 24 * HOUR_MS) },
    },
    select: {
      id: true,
      offerId: true,
      authorPartnerId: true,
      opponent1Id: true,
      opponent2Id: true,
      reportedById: true,
      noShowUserId: true,
      offer: { select: { authorId: true } },
    },
  });

  for (const { offer, ...result } of due) {
    await db.doublesResult.update({
      where: { id: result.id },
      data: { resultReminderSentAt: now },
    });
    await notifyDoublesSettlers({ ...result, authorId: offer.authorId }, now);
  }
  return due.length;
}
