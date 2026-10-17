import { z } from "zod";

import type { Prisma } from "@/lib/generated/prisma/client";
import { District, Surface } from "@/lib/generated/prisma/enums";

// Court search filters on the home page (slice K4). Same approach as the
// offer feed's (lib/offers/feed-filters.ts, task 3.7): they live in the URL
// (/?district=…&surface=…), so a search can be shared and "back" works, and
// a value that doesn't parse is ignored rather than an error.

export type ClubFilters = {
  district?: District;
  /** Clubs that have at least one court of this surface. */
  surface?: Surface;
  /** Clubs with any covered courts: all year, part of them, or a winter bubble. */
  indoor?: boolean;
};

type SearchParams = Record<string, string | string[] | undefined>;

const fields = {
  district: z.enum(District),
  surface: z.enum(Surface),
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseClubFilters(params: SearchParams): ClubFilters {
  const filters: ClubFilters = {};
  for (const key of Object.keys(fields) as (keyof typeof fields)[]) {
    const value = first(params[key]);
    // "" is what the filter form sends for "Any".
    if (value === undefined || value === "") {
      continue;
    }
    const parsed = fields[key].safeParse(value);
    if (parsed.success) {
      Object.assign(filters, { [key]: parsed.data });
    }
  }
  // A checkbox: present with value "1" when checked, absent otherwise.
  if (first(params.indoor) === "1") {
    filters.indoor = true;
  }
  return filters;
}

export function clubWhere(filters: ClubFilters): Prisma.ClubWhereInput {
  const conditions: Prisma.ClubWhereInput[] = [];
  if (filters.district) {
    conditions.push({ district: filters.district });
  }
  if (filters.surface) {
    conditions.push({ surfaces: { has: filters.surface } });
  }
  if (filters.indoor) {
    // A club whose courts are still unknown (null, decision 2.11) is left
    // out: "indoor" is a promise the list can't make for it.
    conditions.push({
      indoor: { in: ["PARTIAL", "YEAR_ROUND", "WINTER_BUBBLE"] },
    });
  }
  return { AND: conditions };
}

/** The court search with these filters. */
export function clubsHref(filters: ClubFilters): string {
  const params = new URLSearchParams();
  if (filters.district) params.set("district", filters.district);
  if (filters.surface) params.set("surface", filters.surface);
  if (filters.indoor) params.set("indoor", "1");
  const query = params.toString();
  return query ? `/?${query}` : "/";
}
