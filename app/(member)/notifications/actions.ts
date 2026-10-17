"use server";

import { z } from "zod";

import { getCurrentUser } from "@/lib/auth/require-user";
import {
  countUnreadNotifications,
  markNotificationsRead,
} from "@/lib/notifications/inbox";

// The header bell's two calls (slice K2b). Both use getCurrentUser, not
// requireUser: the bell keeps polling in an open tab, and a session that
// ended meanwhile should just show no count, not throw.

/** The number on the bell — 0 for a signed-out visitor. */
export async function unreadNotificationCount(): Promise<number> {
  const user = await getCurrentUser();
  return user ? countUnreadNotifications(user.id) : 0;
}

const offerIdSchema = z.uuid().optional();

/**
 * Marks the player's notifications read: all of them (the list was opened)
 * or one offer's (that offer's page was opened).
 */
export async function markNotificationsReadAction(
  offerId?: unknown,
): Promise<void> {
  const user = await getCurrentUser();
  const parsed = offerIdSchema.safeParse(offerId);
  if (!user || !parsed.success) {
    return;
  }
  await markNotificationsRead(user.id, new Date(), parsed.data);
}
