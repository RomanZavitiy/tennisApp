import type { useFormatter } from "next-intl";
import { z } from "zod";

import { db } from "@/lib/db";

// What /clubs/[id] shows about a club (task 2.8). Enum values (surface,
// indoor) are shown via a translator at the enum's own namespace ("Surface",
// "IndoorCourts" — task 1.20), not a label map here.

type Formatter = ReturnType<typeof useFormatter>;

/**
 * "9 October 2026". The column is a plain date, stored as UTC midnight;
 * `format` is a next-intl formatter (useFormatter/getFormatter) so the
 * month name follows the active language, the calendar day doesn't.
 */
export function formatCheckedDate(format: Formatter, date: Date): string {
  return format.dateTime(date, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * The club with every field the page shows, or null for an id that isn't a
 * UUID or doesn't exist. The page turns null into a 404.
 */
export async function getClub(id: string) {
  // The id comes from the URL; Postgres would throw on a non-UUID.
  if (!z.uuid().safeParse(id).success) {
    return null;
  }

  return db.club.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      address: true,
      district: true,
      courtCount: true,
      surfaces: true,
      indoor: true,
      priceInfo: true,
      phone: true,
      websiteUrl: true,
      bookingUrl: true,
      bookingMode: true,
      verifiedAt: true,
    },
  });
}

export type ClubDetails = NonNullable<Awaited<ReturnType<typeof getClub>>>;

/**
 * Follower count and whether `viewerId` follows this club (task O.4). A
 * sibling to `getClub` rather than a change to its shape, so existing
 * callers (and its test) keep returning exactly the row they select — the
 * follow button is the only caller that needs this.
 */
export async function getClubFollowInfo(
  clubId: string,
  viewerId: string | null,
) {
  const [followerCount, viewerFollow] = await Promise.all([
    db.clubFollow.count({ where: { clubId } }),
    viewerId
      ? db.clubFollow.findUnique({
          where: { userId_clubId: { userId: viewerId, clubId } },
          select: { id: true },
        })
      : null,
  ]);
  return { followerCount, viewerFollows: viewerFollow !== null };
}
