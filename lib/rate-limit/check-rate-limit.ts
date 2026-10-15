import { db } from "@/lib/db";
import type { RateLimitAction } from "@/lib/generated/prisma/enums";

// Rate limiting without a new service (decision 2026-10-14, tasks 6.16-6.18):
// a counter table in the same Postgres database, not Redis or another
// store. Each action has one fixed-length window (not sliding) — a plain
// `floor(now / windowMs) * windowMs` bucket, the same instant for every
// check in that window, so checkRateLimit only ever needs to upsert one row
// per window rather than keep a log of individual events to count. The
// trade-off is the usual one for fixed windows: a burst right across a
// window boundary can momentarily allow close to double the limit. That's
// an acceptable cost for anti-abuse limits sized well under what normal use
// ever reaches (see each limit below) — it isn't a billing meter, where a
// sliding window's accuracy would be worth the extra row-per-event cost.
//
// `subject` is a userId for every action except MAGIC_LINK, which keys by
// email: that check happens before a session exists, so there's no userId
// to key by yet.

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

const RATE_LIMITS: Record<
  RateLimitAction,
  { windowMs: number; limit: number; message: string }
> = {
  // 6.17: at most 10 new offers a day.
  NEW_OFFER: {
    windowMs: DAY_MS,
    limit: 10,
    message: "You've posted a lot of offers today. Try again tomorrow.",
  },
  // 6.17: at most 20 join requests a day.
  JOIN_REQUEST: {
    windowMs: DAY_MS,
    limit: 20,
    message: "You've sent a lot of join requests today. Try again tomorrow.",
  },
  // 6.16: at most 60 chat messages every 10 minutes.
  MESSAGE: {
    windowMs: 10 * MINUTE_MS,
    limit: 60,
    message: "You're sending messages too quickly. Wait a few minutes.",
  },
  // 6.18: at most 10 reports a day.
  REPORT: {
    windowMs: DAY_MS,
    limit: 10,
    message: "You've filed a lot of reports today. Try again tomorrow.",
  },
  // 6.16 (decision 2026-10-14): at most 5 magic links an hour per email —
  // checked here before Supabase's own request, which has a stricter,
  // less friendly limit of its own (app/login/actions.ts already handles
  // Supabase's 429 too, for whichever check a burst happens to hit first).
  MAGIC_LINK: {
    windowMs: HOUR_MS,
    limit: 5,
    message: "Too many sign-in emails. Wait a bit and try again.",
  },
};

export type RateLimitResult = { ok: true } | { ok: false; message: string };

/**
 * Counts one more `action` from `subject` in the current fixed window, and
 * refuses once the window's count is over the limit. The limit is still
 * enforced on the request that crosses it (count is incremented first, then
 * compared) — the caller just sees it as the one that got refused.
 */
export async function checkRateLimit(
  subject: string,
  action: RateLimitAction,
  now: Date = new Date(),
): Promise<RateLimitResult> {
  const { windowMs, limit, message } = RATE_LIMITS[action];
  const windowStart = new Date(Math.floor(now.getTime() / windowMs) * windowMs);

  const row = await db.rateLimitCounter.upsert({
    where: { subject_action_windowStart: { subject, action, windowStart } },
    create: { subject, action, windowStart, count: 1 },
    update: { count: { increment: 1 } },
    select: { count: true },
  });

  return row.count > limit ? { ok: false, message } : { ok: true };
}
