import { createTranslator } from "next-intl";

import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email/send";
import { renderEmailHtml, renderEmailText } from "@/lib/email/template";
import en from "@/messages/en.json";
import pl from "@/messages/pl.json";
import { recordNotification } from "@/lib/notifications/inbox";
import { createUnsubscribeToken } from "@/lib/notifications/unsubscribe-token";
import { sendPush } from "@/lib/push/send-push";

// Task 1.20: push and the email fallback go out in the recipient's own
// saved language (users.locale) — there's no request/cookie to read it
// from here, unlike every page render — so this uses next-intl's
// standalone createTranslator() instead of getTranslations().
const MESSAGES = { EN: en, PL: pl } as const;

// The single entry point for every notification (task 5.16): `notify(userId,
// event)` loads that user's subscriptions and settings, sends push to every
// subscription, cleans up the ones the push service reports gone, and —
// only for the three events decision 2026-10-14 names, and only when there's
// no active subscription left — falls back to email (5.6). A send failure
// is logged (lib/push, lib/email) and never thrown, so the action that
// triggered it (join, message, cron) always finishes. Before any of that,
// every event lands in the in-app list behind the header bell (slice K2a):
// push and email both miss players who never subscribed or whose address
// Resend won't deliver to yet, and the bell is what still reaches them.

export type NotificationEvent =
  | { kind: "JOIN_REQUESTED"; offerId: string }
  | { kind: "JOIN_ACCEPTED"; offerId: string }
  | { kind: "JOIN_DECLINED"; offerId: string }
  | { kind: "NEW_MESSAGE"; offerId: string; offerJoinId: string }
  | { kind: "COURT_BOOKED"; offerId: string }
  | { kind: "MATCH_REMINDER_3H"; offerId: string }
  | { kind: "HOW_DID_IT_GO"; offerId: string }
  | { kind: "CONFIRM_RESULT_REMINDER"; offerId: string }
  | { kind: "NEW_OFFER_FOR_LEVEL"; offerId: string };

type Kind = NotificationEvent["kind"];

// "Matches & messages" vs. "New offers for my level" (task 5.3) — the two
// gated categories the settings toggles control.
const CATEGORY: Record<Kind, "matches" | "newOffers"> = {
  JOIN_REQUESTED: "matches",
  JOIN_ACCEPTED: "matches",
  JOIN_DECLINED: "matches",
  NEW_MESSAGE: "matches",
  COURT_BOOKED: "matches",
  MATCH_REMINDER_3H: "matches",
  HOW_DID_IT_GO: "matches",
  CONFIRM_RESULT_REMINDER: "matches",
  NEW_OFFER_FOR_LEVEL: "newOffers",
};

// Decision 2026-10-14: email fallback exists only for "new join request,
// accepted, confirm the result" — every other event is push-only.
const EMAIL_ELIGIBLE: ReadonlySet<Kind> = new Set([
  "JOIN_REQUESTED",
  "JOIN_ACCEPTED",
  "CONFIRM_RESULT_REMINDER",
]);

// At most one push per thread per 5 minutes (task 5.16). Shared by both
// participants of a private join thread rather than tracked per recipient —
// a thread only has two people, and one shared cooldown is a simpler column
// than one per direction for a rule that's purely about not being noisy.
const MESSAGE_PUSH_THROTTLE_MS = 5 * 60 * 1000;

async function claimMessagePushSlot(
  offerJoinId: string,
  now: Date,
): Promise<boolean> {
  const cutoff = new Date(now.getTime() - MESSAGE_PUSH_THROTTLE_MS);
  const { count } = await db.offerJoin.updateMany({
    where: {
      id: offerJoinId,
      OR: [{ lastMessagePushAt: null }, { lastMessagePushAt: { lt: cutoff } }],
    },
    data: { lastMessagePushAt: now },
  });
  return count > 0;
}

// Vercel sets this for every deployment, preview or production (no env var
// of our own to set up) — https://<VERCEL_URL> is this deployment's own
// hostname, the same one a real request to it would have as its origin.
function appUrl(): string {
  return process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";
}

export async function notify(
  userId: string,
  event: NotificationEvent,
  now: Date = new Date(),
): Promise<void> {
  // Not behind the settings toggles or the message throttle below: those
  // decide what interrupts the player, the bell only lists what happened.
  await recordNotification(userId, event, now);

  if (event.kind === "NEW_MESSAGE") {
    const claimed = await claimMessagePushSlot(event.offerJoinId, now);
    if (!claimed) {
      return;
    }
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      locale: true,
      notifyMatches: true,
      notifyNewOffers: true,
      notifyEmailFallback: true,
      pushSubscriptions: {
        select: { id: true, endpoint: true, p256dh: true, auth: true },
      },
    },
  });
  if (!user) {
    return;
  }

  const enabled =
    CATEGORY[event.kind] === "matches"
      ? user.notifyMatches
      : user.notifyNewOffers;
  if (!enabled) {
    return;
  }

  const { locale } = user;
  const tNotifications = createTranslator({
    locale: locale.toLowerCase(),
    messages: MESSAGES[locale],
    namespace: "PushNotifications",
  });
  const title = tNotifications(`${event.kind}.title`);
  const body = tNotifications(`${event.kind}.body`);
  const path = `/offers/${event.offerId}`;

  let expiredCount = 0;
  for (const subscription of user.pushSubscriptions) {
    const outcome = await sendPush(subscription, {
      title,
      body,
      url: path,
    });
    if (!outcome.ok && outcome.expired) {
      expiredCount++;
      await db.pushSubscription
        .delete({ where: { id: subscription.id } })
        .catch(() => {
          // Already gone (e.g. the user unsubscribed in the same moment) —
          // nothing left to clean up.
        });
    }
  }

  const hasActiveSubscription =
    user.pushSubscriptions.length - expiredCount > 0;
  if (hasActiveSubscription) {
    return;
  }
  if (!EMAIL_ELIGIBLE.has(event.kind) || !user.notifyEmailFallback) {
    return;
  }
  if (!user.email) {
    return;
  }

  const tEmail = createTranslator({
    locale: locale.toLowerCase(),
    messages: MESSAGES[locale],
    namespace: "EmailTemplate",
  });
  const actionUrl = `${appUrl()}${path}`;
  const unsubscribeUrl = `${appUrl()}/unsubscribe?token=${createUnsubscribeToken(userId)}`;
  const templateInput = {
    heading: title,
    body,
    actionUrl,
    actionLabel: tEmail("actionLabel"),
    unsubscribeUrl,
    unsubscribeLabel: tEmail("unsubscribeLabel"),
  };
  await sendEmail({
    to: user.email,
    subject: title,
    html: renderEmailHtml(templateInput),
    text: renderEmailText(templateInput),
  });
}
