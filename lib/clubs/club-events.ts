import { db } from "@/lib/db";

// Club news (slice PD5, task PD5.1): what a club's page and its panel list,
// and how much a club may post. Three a day is plenty for a tournament, an
// open evening and a reminder, and each one is a push to every follower.

export const CLUB_EVENTS_PER_DAY = 3;
/** How many of the newest pieces of news a club's page shows. */
export const CLUB_EVENTS_SHOWN = 5;

const DAY_MS = 24 * 60 * 60 * 1000;

export type ClubEventItem = {
  id: string;
  title: string;
  body: string;
  createdAt: Date;
};

/** A club's newest news first. */
export async function getClubEvents(
  clubId: string,
  take: number = CLUB_EVENTS_SHOWN,
): Promise<ClubEventItem[]> {
  return db.clubEvent.findMany({
    where: { clubId },
    select: { id: true, title: true, body: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take,
  });
}

/** Whether the club still may post today: under CLUB_EVENTS_PER_DAY in the
 * last 24 hours. A rolling window, not a calendar day, so a burst just
 * before midnight doesn't reset at 00:00. */
export async function canPostClubEvent(
  clubId: string,
  now: Date = new Date(),
): Promise<boolean> {
  const recent = await db.clubEvent.count({
    where: { clubId, createdAt: { gt: new Date(now.getTime() - DAY_MS) } },
  });
  return recent < CLUB_EVENTS_PER_DAY;
}
