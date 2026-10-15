import { db } from "@/lib/db";
import { notify } from "@/lib/notifications/notify";

// The time-based pushes (tasks 5.10, 5.16), run by the hourly GitHub Actions
// workflow against /api/cron?job=reminders (decision 2026-10-15, "Cron").
// Each kind is sent at most once per offer/result — the sent_at column
// claimed by the update below, not re-derived — and every match is
// evaluated once per hourly run, so "~3h before" and "~2h after" are only
// accurate to that hour, which is the cron's own granularity.

const HOUR_MS = 3_600_000;

/** ~3h before an accepted match's start: a nudge to both sides. */
export async function sendMatchReminders(now = new Date()): Promise<number> {
  const due = await db.sparringOffer.findMany({
    where: {
      matchReminderSentAt: null,
      status: { in: ["OPEN", "FULL"] },
      startsAt: { gt: now, lte: new Date(now.getTime() + 3 * HOUR_MS) },
      joins: { some: { status: "ACCEPTED" } },
    },
    select: {
      id: true,
      authorId: true,
      joins: { where: { status: "ACCEPTED" }, select: { userId: true } },
    },
  });

  for (const offer of due) {
    await db.sparringOffer.update({
      where: { id: offer.id },
      data: { matchReminderSentAt: now },
    });
    for (const userId of [
      offer.authorId,
      ...offer.joins.map((j) => j.userId),
    ]) {
      await notify(
        userId,
        { kind: "MATCH_REMINDER_3H", offerId: offer.id },
        now,
      );
    }
  }
  return due.length;
}

/** ~2h after an accepted match's start: "How did it go?" */
export async function sendHowDidItGoPrompts(now = new Date()): Promise<number> {
  const due = await db.sparringOffer.findMany({
    where: {
      howDidItGoSentAt: null,
      status: { in: ["OPEN", "FULL"] },
      startsAt: { lte: new Date(now.getTime() - 2 * HOUR_MS) },
      joins: { some: { status: "ACCEPTED" } },
    },
    select: {
      id: true,
      authorId: true,
      joins: { where: { status: "ACCEPTED" }, select: { userId: true } },
    },
  });

  for (const offer of due) {
    await db.sparringOffer.update({
      where: { id: offer.id },
      data: { howDidItGoSentAt: now },
    });
    for (const userId of [
      offer.authorId,
      ...offer.joins.map((j) => j.userId),
    ]) {
      await notify(userId, { kind: "HOW_DID_IT_GO", offerId: offer.id }, now);
    }
  }
  return due.length;
}

/** ~24h after filing, to whichever side still hasn't confirmed or disputed. */
export async function sendResultConfirmationReminders(
  now = new Date(),
): Promise<number> {
  const due = await db.matchResult.findMany({
    where: {
      status: "PENDING",
      resultReminderSentAt: null,
      createdAt: { lte: new Date(now.getTime() - 24 * HOUR_MS) },
    },
    select: {
      id: true,
      reportedBy: true,
      offerJoin: {
        select: {
          offerId: true,
          userId: true,
          offer: { select: { authorId: true } },
        },
      },
    },
  });

  for (const result of due) {
    await db.matchResult.update({
      where: { id: result.id },
      data: { resultReminderSentAt: now },
    });
    const recipientId =
      result.reportedBy === "AUTHOR"
        ? result.offerJoin.userId
        : result.offerJoin.offer.authorId;
    await notify(
      recipientId,
      { kind: "CONFIRM_RESULT_REMINDER", offerId: result.offerJoin.offerId },
      now,
    );
  }
  return due.length;
}

export type ReminderCounts = {
  matchReminders: number;
  howDidItGoPrompts: number;
  resultConfirmationReminders: number;
};

export async function runNotificationReminders(
  now = new Date(),
): Promise<ReminderCounts> {
  return {
    matchReminders: await sendMatchReminders(now),
    howDidItGoPrompts: await sendHowDidItGoPrompts(now),
    resultConfirmationReminders: await sendResultConfirmationReminders(now),
  };
}
