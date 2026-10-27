import { db } from "@/lib/db";
import { notify, notifyBookingDecided } from "@/lib/notifications/notify";
import { toKrakowLocal } from "@/lib/offers/krakow-time";

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

/** K.18: staff have this long to confirm or decline before it happens automatically — the owner checklist's suggested "T". */
const AUTO_DECLINE_HOURS = 3;

/** "18:00–19:30" — Kraków wall-clock, not run through next-intl: this job
 * has no request to resolve a locale from, unlike the three reminders
 * above (each a push to one side of an *existing* match, not cron-only
 * text), so it can't reuse getFormatter(). */
function krakowTimeRangeLabel(startsAt: Date, endsAt: Date): string {
  return `${toKrakowLocal(startsAt).slice(11)}–${toKrakowLocal(endsAt).slice(11)}`;
}

/**
 * K.18: a PENDING request nobody decided in time reads as declined — the
 * player needs the court search to move on, and a club that's slow to
 * check the panel shouldn't leave them hanging indefinitely. The update's
 * `status: "PENDING"` condition is its own claim (no separate sent_at
 * column like the other three jobs need): a booking already decided
 * doesn't match it again next run, and it also means a staff decision that
 * lands in the same instant as this job wins — the count from `updateMany`
 * says whether this run was the one that actually declined it.
 */
export async function autoDeclinePendingBookings(
  now = new Date(),
): Promise<number> {
  const due = await db.booking.findMany({
    where: {
      status: "PENDING",
      startsAt: { lte: new Date(now.getTime() + AUTO_DECLINE_HOURS * HOUR_MS) },
    },
    select: {
      id: true,
      userId: true,
      startsAt: true,
      endsAt: true,
      court: { select: { name: true } },
    },
  });

  let declined = 0;
  for (const booking of due) {
    const { count } = await db.booking.updateMany({
      where: { id: booking.id, status: "PENDING" },
      data: { status: "DECLINED", decidedAt: now },
    });
    if (count === 0) {
      continue;
    }
    declined++;
    await notifyBookingDecided(booking.userId, {
      court: booking.court.name,
      timeRange: krakowTimeRangeLabel(booking.startsAt, booking.endsAt),
      status: "DECLINED",
    });
  }
  return declined;
}

export type ReminderCounts = {
  matchReminders: number;
  howDidItGoPrompts: number;
  resultConfirmationReminders: number;
  autoDeclinedBookings: number;
};

export async function runNotificationReminders(
  now = new Date(),
): Promise<ReminderCounts> {
  return {
    matchReminders: await sendMatchReminders(now),
    howDidItGoPrompts: await sendHowDidItGoPrompts(now),
    resultConfirmationReminders: await sendResultConfirmationReminders(now),
    autoDeclinedBookings: await autoDeclinePendingBookings(now),
  };
}
