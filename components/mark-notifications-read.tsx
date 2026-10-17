"use client";

import { useEffect } from "react";

import { markNotificationsReadAction } from "@/app/(member)/notifications/actions";
import { NOTIFICATIONS_CHANGED_EVENT } from "@/components/notification-bell";

/** Marks notifications read once the page showing them has mounted — all of
 * them on /notifications, one offer's on that offer's page (slice K2b). On
 * mount, not during the server render, so a link prefetch can't mark
 * anything read before the player actually opens the page. Renders nothing. */
export function MarkNotificationsRead({ offerId }: { offerId?: string }) {
  useEffect(() => {
    void markNotificationsReadAction(offerId).then(() => {
      window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));
    });
  }, [offerId]);

  return null;
}
