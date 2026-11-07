"use client";

import { useEffect } from "react";

import { trackCandidatesViewed } from "@/app/offers/[id]/candidates-actions";

/** Fires `candidates_viewed` once the "Кого запросити" section (task S2.2)
 * has mounted — on mount, not during the server render, same reasoning as
 * MarkNotificationsRead. Renders nothing. */
export function MarkCandidatesViewed({ count }: { count: number }) {
  useEffect(() => {
    void trackCandidatesViewed(count);
  }, [count]);

  return null;
}
