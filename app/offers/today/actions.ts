"use server";

import { captureEvent } from "@/lib/analytics/posthog";
import { requireUser } from "@/lib/auth/require-user";

// "Грати сьогодні" (slice U3, task U3.3): three events to see whether
// anyone actually uses this page, same convention as
// candidates-actions.ts's trackCandidatesViewed — a page render never
// fires analytics directly.

export async function trackPlayTodayViewed(): Promise<void> {
  const user = await requireUser();
  await captureEvent("play_today_viewed", user.id, {});
}

export async function trackPlayTodayResultSelected(): Promise<void> {
  const user = await requireUser();
  await captureEvent("play_today_result_selected", user.id, {});
}

export async function trackPlayTodayEmptyState(): Promise<void> {
  const user = await requireUser();
  await captureEvent("play_today_empty_state", user.id, {});
}
