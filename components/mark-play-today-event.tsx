"use client";

import { useEffect } from "react";

/**
 * Fires a "Грати сьогодні" analytics action once this has mounted (slice
 * U3, task U3.3) — on mount, not during the server render, same reasoning
 * as MarkCandidatesViewed. Renders nothing. One component for both
 * `trackPlayTodayViewed` and `trackPlayTodayEmptyState`
 * (app/offers/today/actions.ts): neither takes an argument, so there's
 * nothing a second, near-identical component would do differently.
 */
export function MarkPlayTodayEvent({
  action,
}: {
  // Always a stable reference to one of the two server actions above
  // (never an inline closure), so listing it as the only dependency still
  // fires exactly once per mount.
  action: () => Promise<void>;
}) {
  useEffect(() => {
    void action();
  }, [action]);

  return null;
}
