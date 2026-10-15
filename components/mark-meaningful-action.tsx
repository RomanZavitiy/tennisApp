"use client";

import { useEffect } from "react";

import { markMeaningfulAction } from "@/lib/push/meaningful-action";

/** Flags "the first offer created" (task 5.15) — mounted on /offers/[id]
 * only right after createOffer redirects here with ?created=1. Renders
 * nothing. "The first join request" is flagged the other way, from
 * OfferActionButton's onSuccess on the "Ask to join" button itself. */
export function MarkMeaningfulAction() {
  useEffect(() => {
    markMeaningfulAction();
  }, []);

  return null;
}
