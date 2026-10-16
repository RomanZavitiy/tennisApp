import { PostHog } from "posthog-node";

import type { AnalyticsEvent, PropertiesFor } from "@/lib/analytics/events";

// The one place `posthog-node` is called (task 6.5/6.6). All 10 events fire
// from server actions, never the browser, so there is no client-side
// PostHog SDK and nothing it could ever store in a cookie — the no-cookie
// requirement in decision 2026-10-14 holds by construction, not by a
// `persistence: 'memory'` client setting (see .agents/decisions.md,
// 2026-10-16, for why this implementation differs from the decision's
// literal wording). POSTHOG_KEY (.env.example) is set by the human, never
// by this code, so a deploy without it yet must degrade to "no event
// sent", the same pattern as lib/push/send-push.ts.

// Defense in depth: even though each event's property type (lib/analytics/
// events.ts) already forbids these fields, a renamed variable or a future
// edit could still slip one through — this drops it instead of sending it.
const BANNED_PROPERTY_KEYS = [
  "email",
  "name",
  "firstname",
  "lastname",
  "content",
  "comment",
  "message",
  "text",
  "birthdate",
  "phone",
  "address",
];

let client: PostHog | null | undefined;

function getClient(): PostHog | null {
  if (client !== undefined) {
    return client;
  }
  const key = process.env.POSTHOG_KEY;
  if (!key) {
    console.warn("POSTHOG_KEY isn't set — skipping analytics.");
    client = null;
    return client;
  }
  client = new PostHog(key, {
    host: process.env.POSTHOG_HOST ?? "https://eu.i.posthog.com",
    // Short-lived server actions must flush before the function returns
    // (captureEvent awaits flush() itself), not batch in the background.
    flushAt: 1,
    flushInterval: 0,
  });
  return client;
}

// Exported only so the test below can check it without needing POSTHOG_KEY
// set — captureEvent() is a no-op without a configured client.
export function sanitize(
  properties: Record<string, unknown>,
): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(properties)) {
    if (BANNED_PROPERTY_KEYS.includes(key.toLowerCase())) {
      console.warn(`Analytics property "${key}" looks like PII — dropped.`);
      continue;
    }
    clean[key] = value;
  }
  return clean;
}

/**
 * Fires one of the launch-readiness events. Never throws: analytics must
 * never break the mutation it's attached to. `distinctId` is the user's id
 * — the only identifier sent, no email or name.
 */
export async function captureEvent<E extends AnalyticsEvent>(
  event: E,
  distinctId: string,
  properties?: PropertiesFor<E>,
): Promise<void> {
  const posthog = getClient();
  if (!posthog) {
    return;
  }
  try {
    posthog.capture({
      distinctId,
      event,
      properties: properties ? sanitize(properties) : undefined,
    });
    await posthog.flush();
  } catch (error) {
    console.error("PostHog capture failed:", error);
  }
}
