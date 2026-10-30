import { z } from "zod";

import { District } from "@/lib/generated/prisma/enums";

// Leaderboard filters (task L.3): live in the URL (/leaderboard?district=…&level=…),
// same approach as the offer feed's (lib/offers/feed-filters.ts) and the court
// search's (lib/clubs/club-filters.ts) — a value that doesn't parse is ignored
// rather than an error, since this is a GET view, not a form submit.

/** A player-facing NTRP band, each mapping to a range on the 1.5–7.0 scale. */
export const NTRP_BAND_KEYS = [
  "beginner",
  "intermediate",
  "advanced",
  "expert",
] as const;
export type NtrpBand = (typeof NTRP_BAND_KEYS)[number];

export const NTRP_BANDS: Record<NtrpBand, { min: number; max: number }> = {
  beginner: { min: 1.5, max: 2.5 },
  intermediate: { min: 3, max: 4 },
  advanced: { min: 4.5, max: 5.5 },
  expert: { min: 6, max: 7 },
};

export type LeaderboardFilters = {
  district?: District;
  level?: NtrpBand;
};

type SearchParams = Record<string, string | string[] | undefined>;

const fields = {
  district: z.enum(District),
  level: z.enum(NTRP_BAND_KEYS),
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseLeaderboardFilters(
  params: SearchParams,
): LeaderboardFilters {
  const filters: LeaderboardFilters = {};
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

/** The leaderboard with these filters applied. */
export function leaderboardHref(filters: LeaderboardFilters): string {
  const params = new URLSearchParams();
  if (filters.district) params.set("district", filters.district);
  if (filters.level) params.set("level", filters.level);
  const query = params.toString();
  return query ? `/leaderboard?${query}` : "/leaderboard";
}
