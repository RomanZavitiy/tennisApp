import { db } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import type {
  CoachLevel,
  District,
  Locale,
} from "@/lib/generated/prisma/enums";
import type { CoachFilters } from "@/lib/validation/coaches-query";

// The coaching directory (task P.7): a read-only list of owner-curated
// coaches, filterable by district and level — no self-registration, no
// approval queue in v1 (decision 2026-11-07, task P.1).

export type CoachClub = { id: string; name: string };

export type CoachListing = {
  id: string;
  slug: string;
  name: string;
  bio: string | null;
  district: District | null;
  levels: CoachLevel[];
  languages: Locale[];
  priceInfo: string | null;
  phone: string | null;
  websiteUrl: string | null;
  verifiedAt: Date;
  clubs: CoachClub[];
};

const coachSelect = {
  id: true,
  slug: true,
  name: true,
  bio: true,
  district: true,
  levels: true,
  languages: true,
  priceInfo: true,
  phone: true,
  websiteUrl: true,
  verifiedAt: true,
  clubs: { select: { id: true, name: true }, orderBy: { name: "asc" } },
} satisfies Prisma.CoachSelect;

export async function getCoaches(
  filters: CoachFilters = {},
): Promise<CoachListing[]> {
  const where: Prisma.CoachWhereInput = {};
  if (filters.district) {
    where.district = filters.district;
  }
  if (filters.level) {
    where.levels = { has: filters.level };
  }

  return db.coach.findMany({
    where,
    orderBy: { name: "asc" },
    select: coachSelect,
  });
}

/**
 * The coaches teaching at one club (task P.11's "Coaches at this club"),
 * ordered by name. A sibling to getCoaches rather than a filter option on
 * it: the club page needs only name + slug (to link into /coaches#slug),
 * not the full listing shape.
 */
export async function getCoachesForClub(
  clubId: string,
): Promise<{ slug: string; name: string }[]> {
  return db.coach.findMany({
    where: { clubs: { some: { id: clubId } } },
    orderBy: { name: "asc" },
    select: { slug: true, name: true },
  });
}
