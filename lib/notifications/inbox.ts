import { db } from "@/lib/db";
import type { District, NotificationKind } from "@/lib/generated/prisma/enums";
import type { NotificationEvent } from "@/lib/notifications/notify";

// The in-app notification list behind the header bell (slice K2a). notify()
// records every event here; the bell (K2b) reads it back. Only ever read and
// written on the server through Prisma — the table has RLS on and no policy.

/** How many notifications the list shows: older ones just drop off it. */
export const NOTIFICATIONS_SHOWN = 30;

export type InboxNotification = {
  id: string;
  kind: NotificationKind;
  createdAt: Date;
  readAt: Date | null;
  offer: {
    id: string;
    startsAt: Date;
    district: District | null;
    club: { name: string } | null;
  };
};

/**
 * Records one event for the bell. A new chat message refreshes its thread's
 * unread row instead of adding another, so a conversation shows up once.
 * Never throws — same contract as push and email (task 5.16): a failure here
 * must not stop the join, message or cron run that triggered it.
 */
export async function recordNotification(
  userId: string,
  event: NotificationEvent,
  now: Date,
): Promise<void> {
  try {
    const offerJoinId = event.kind === "NEW_MESSAGE" ? event.offerJoinId : null;
    if (offerJoinId) {
      const { count } = await db.notification.updateMany({
        where: { userId, offerJoinId, readAt: null },
        data: { createdAt: now },
      });
      if (count > 0) {
        return;
      }
    }
    await db.notification.create({
      data: {
        userId,
        kind: event.kind,
        offerId: event.offerId,
        offerJoinId,
        createdAt: now,
      },
    });
  } catch (error) {
    console.error("Recording a notification failed:", error);
  }
}

/** The player's latest notifications, newest first. */
export async function listNotifications(
  userId: string,
): Promise<InboxNotification[]> {
  return db.notification.findMany({
    where: { userId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: NOTIFICATIONS_SHOWN,
    select: {
      id: true,
      kind: true,
      createdAt: true,
      readAt: true,
      offer: {
        select: {
          id: true,
          startsAt: true,
          district: true,
          club: { select: { name: true } },
        },
      },
    },
  });
}

/** The number on the bell. */
export async function countUnreadNotifications(
  userId: string,
): Promise<number> {
  return db.notification.count({ where: { userId, readAt: null } });
}

/**
 * Marks the player's unread notifications as read — all of them, or only
 * one offer's (opening that offer has shown the player what happened).
 */
export async function markNotificationsRead(
  userId: string,
  now: Date,
  offerId?: string,
): Promise<void> {
  await db.notification.updateMany({
    where: { userId, readAt: null, ...(offerId ? { offerId } : {}) },
    data: { readAt: now },
  });
}
