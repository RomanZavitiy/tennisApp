"use server";

import { z } from "zod";

import { captureEvent } from "@/lib/analytics/posthog";
import { requireUser } from "@/lib/auth/require-user";

/** `candidates_viewed {count}` (§4): fired once the author's own "Кого
 * запросити" section has actually mounted — a page render never fires
 * analytics directly, same convention as every other captureEvent call. */
export async function trackCandidatesViewed(count: unknown): Promise<void> {
  const user = await requireUser();
  const parsed = z.coerce.number().int().min(0).safeParse(count);
  if (!parsed.success) {
    return;
  }
  await captureEvent("candidates_viewed", user.id, { count: parsed.data });
}
