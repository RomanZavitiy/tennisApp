import { z } from "zod";

import { db } from "@/lib/db";
import type { IndoorCourts } from "@/lib/generated/prisma/enums";

// What /clubs/[id] shows about a club (task 2.8), and how its enum values
// read on the page. `Record<…, string>` makes the compiler insist on a label
// for every enum value, so a value added to the schema can't go unlabelled.

// Surface names also label the offer form (3.5), a client component, so they
// live in a module that doesn't import the database.
export { SURFACE_LABELS } from "@/lib/clubs/surface-labels";

export const INDOOR_LABELS: Record<IndoorCourts, string> = {
  NONE: "Outdoor only",
  PARTIAL: "Some courts indoors all year",
  YEAR_ROUND: "Indoors all year",
  WINTER_BUBBLE: "Covered in winter (bubble)",
};

/** "9 October 2026". The column is a plain date, stored as UTC midnight. */
export function formatCheckedDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
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
      verifiedAt: true,
    },
  });
}

export type ClubDetails = NonNullable<Awaited<ReturnType<typeof getClub>>>;
