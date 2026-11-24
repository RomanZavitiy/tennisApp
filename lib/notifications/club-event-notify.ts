import { db } from "@/lib/db";
import {
  hasPushCapacityNow,
  warsawDateString,
} from "@/lib/matching/offer-interest";
import { sendPush } from "@/lib/push/send-push";

// "Your club posted news" (slice PD5, task PD5.1): a push to the club's
// followers, right after a staff member posts from the club panel. Push
// only — the bell's list (lib/notifications/inbox.ts) is shaped around an
// offer, and news has none; the news itself stays on the club's page.
// Same toggle, daily cap and quiet hours as "new offer for my level"
// (lib/matching/offer-interest.ts), and counted against the same cap, so a
// busy club can't add to a player's daily pushes beyond what they agreed
// to. Never to the staff member who posted it. Never throws: the news is
// already saved.

const BODY_MAX = 140;

export type ClubEventPush = {
  clubId: string;
  clubName: string;
  title: string;
  body: string;
  authorId: string;
};

function shorten(text: string): string {
  return text.length <= BODY_MAX ? text : `${text.slice(0, BODY_MAX - 1)}…`;
}

export async function notifyClubFollowers(
  event: ClubEventPush,
  now: Date = new Date(),
): Promise<string[]> {
  try {
    return await pushToFollowers(event, now);
  } catch (error) {
    console.error("Club news push failed:", error);
    return [];
  }
}

async function pushToFollowers(
  event: ClubEventPush,
  now: Date,
): Promise<string[]> {
  const follows = await db.clubFollow.findMany({
    where: {
      clubId: event.clubId,
      userId: { not: event.authorId },
      user: { notifyNewOffers: true, onboardingCompletedAt: { not: null } },
    },
    select: {
      user: {
        select: {
          id: true,
          notifyNewOffers: true,
          offerPushSentOn: true,
          offerPushSentCount: true,
          pushSubscriptions: {
            select: { id: true, endpoint: true, p256dh: true, auth: true },
          },
        },
      },
    },
  });

  const today = warsawDateString(now);
  const payload = {
    title: `${event.clubName} · ${event.title}`,
    body: shorten(event.body),
    url: `/clubs/${event.clubId}`,
  };
  const notified: string[] = [];

  for (const { user } of follows) {
    const sentOn = user.offerPushSentOn
      ? user.offerPushSentOn.toISOString().slice(0, 10)
      : null;
    const open = hasPushCapacityNow(
      {
        notifyNewOffers: user.notifyNewOffers,
        offerPushSentOn: sentOn,
        offerPushSentCount: user.offerPushSentCount,
      },
      now,
    );
    // Nobody to send to: don't spend the player's daily cap on nothing.
    if (!open || user.pushSubscriptions.length === 0) {
      continue;
    }

    for (const subscription of user.pushSubscriptions) {
      const outcome = await sendPush(subscription, payload);
      if (!outcome.ok && outcome.expired) {
        await db.pushSubscription
          .delete({ where: { id: subscription.id } })
          .catch(() => {
            // Already gone — nothing left to clean up.
          });
      }
    }
    await db.user.update({
      where: { id: user.id },
      data:
        sentOn === today
          ? { offerPushSentCount: { increment: 1 } }
          : {
              offerPushSentOn: new Date(`${today}T00:00:00Z`),
              offerPushSentCount: 1,
            },
    });
    notified.push(user.id);
  }
  return notified;
}
