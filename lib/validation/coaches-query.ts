import { z } from "zod";

import { CoachLevel, District } from "@/lib/generated/prisma/enums";

// Coach directory filters (task P.8): live in the URL
// (/coaches?district=…&level=…), same lenient GET-view rule as
// lib/validation/leaderboard.ts — a value that doesn't parse is ignored
// rather than an error, since this is a GET view, not a form submit.

export type CoachFilters = {
  district?: District;
  level?: CoachLevel;
};

type SearchParams = Record<string, string | string[] | undefined>;

const fields = {
  district: z.enum(District),
  level: z.enum(CoachLevel),
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseCoachFilters(params: SearchParams): CoachFilters {
  const filters: CoachFilters = {};
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
  return filters;
}

/** The coach directory with these filters applied. */
export function coachesHref(filters: CoachFilters): string {
  const params = new URLSearchParams();
  if (filters.district) params.set("district", filters.district);
  if (filters.level) params.set("level", filters.level);
  const query = params.toString();
  return query ? `/coaches?${query}` : "/coaches";
}
