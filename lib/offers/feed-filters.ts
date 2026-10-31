import { z } from "zod";

import type { Prisma } from "@/lib/generated/prisma/client";
import { District, OfferFormat } from "@/lib/generated/prisma/enums";
import { isOfferDuration, type OfferDuration } from "@/lib/offers/duration";
import { krakowHour, krakowLocalToDate } from "@/lib/offers/krakow-time";
import { NTRP_LEVELS } from "@/lib/profile/options";

// Feed filters (task 3.7). They live in the URL (/offers?date=…&district=…),
// so a filtered feed can be shared and "back" works; the server reads them
// here and turns them into the query. A value that doesn't parse is ignored
// rather than an error — a hand-edited or outdated link still shows a feed.

/** Parts of the day a player can pick (slice K5), by Kraków start hour. */
export const TIMES_OF_DAY = ["morning", "afternoon", "evening"] as const;
export type TimeOfDay = (typeof TIMES_OF_DAY)[number];

export type FeedFilters = {
  /** A Kraków calendar day, "YYYY-MM-DD". */
  date?: string;
  district?: District;
  /** The player's level: offers whose NTRP range includes it. */
  ntrp?: number;
  format?: OfferFormat;
  /** Only offers whose court is already booked (task 3.22). */
  courtBooked?: boolean;
  /** How long the game is (slice K5). */
  duration?: OfferDuration;
  /** When in the day it starts (slice K5). */
  time?: TimeOfDay;
};

type SearchParams = Record<string, string | string[] | undefined>;

const fields = {
  date: z.iso.date(),
  district: z.enum(District),
  ntrp: z.coerce.number().refine((level) => NTRP_LEVELS.includes(level)),
  format: z.enum(OfferFormat),
  duration: z.coerce.number().refine(isOfferDuration),
  time: z.enum(TIMES_OF_DAY),
};

export function parseFeedFilters(params: SearchParams): FeedFilters {
  const filters: FeedFilters = {};
  for (const key of Object.keys(fields) as (keyof typeof fields)[]) {
    const raw = params[key];
    const value = Array.isArray(raw) ? raw[0] : raw;
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
  const courtBooked = params.courtBooked;
  if ((Array.isArray(courtBooked) ? courtBooked[0] : courtBooked) === "1") {
    filters.courtBooked = true;
  }
  return filters;
}

/** The day after a "YYYY-MM-DD" date, in the same format. */
function nextDay(date: string): string {
  const next = new Date(`${date}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  return next.toISOString().slice(0, 10);
}

/**
 * The feed's query: open offers that haven't started, narrowed by the
 * filters. A signed-in viewer's own offers stay in (slice K1): an author
 * who can't find the offer they just posted assumes it was lost.
 */
export function feedWhere(
  filters: FeedFilters,
  now: Date,
): Prisma.SparringOfferWhereInput {
  const conditions: Prisma.SparringOfferWhereInput[] = [
    { status: "OPEN" },
    { startsAt: { gt: now } },
  ];

  if (filters.date) {
    // Midnight always exists in Kraków (clocks change at 2–3 a.m.), so
    // these never come back null for a valid date.
    const start = krakowLocalToDate(`${filters.date}T00:00`);
    const end = krakowLocalToDate(`${nextDay(filters.date)}T00:00`);
    if (start && end) {
      conditions.push({ startsAt: { gte: start, lt: end } });
    }
  }
  if (filters.district) {
    conditions.push({ district: filters.district });
  }
  if (filters.ntrp !== undefined) {
    // An empty bound means "any level" on that side.
    conditions.push(
      { OR: [{ ntrpMin: null }, { ntrpMin: { lte: filters.ntrp } }] },
      { OR: [{ ntrpMax: null }, { ntrpMax: { gte: filters.ntrp } }] },
    );
  }
  if (filters.format) {
    conditions.push({ format: filters.format });
  }
  if (filters.courtBooked) {
    conditions.push({ courtStatus: "BOOKED" });
  }
  if (filters.duration) {
    conditions.push({ durationMinutes: filters.duration });
  }
  // `time` isn't here: the hour in Kraków isn't a column, so getOfferFeed
  // applies matchesTimeOfDay to the rows instead.

  return { AND: conditions };
}

/**
 * Whether an offer starting at `startsAt` falls in that part of the day, on
 * the Kraków clock: morning before 12:00, afternoon 12:00-16:59, evening
 * from 17:00 — after work, when most amateur games are.
 */
export function matchesTimeOfDay(startsAt: Date, time: TimeOfDay): boolean {
  const hour = krakowHour(startsAt);
  if (time === "morning") return hour < 12;
  if (time === "afternoon") return hour >= 12 && hour < 17;
  return hour >= 17;
}

/**
 * A link to the feed with these filters, on this page (page 1 is left out).
 * showHidden (slice N) links to the hidden-offers view instead.
 */
export function feedHref(
  filters: FeedFilters,
  page = 1,
  showHidden = false,
): string {
  const params = new URLSearchParams();
  if (filters.date) params.set("date", filters.date);
  if (filters.district) params.set("district", filters.district);
  if (filters.ntrp !== undefined) params.set("ntrp", filters.ntrp.toFixed(1));
  if (filters.format) params.set("format", filters.format);
  if (filters.courtBooked) params.set("courtBooked", "1");
  if (filters.duration) params.set("duration", String(filters.duration));
  if (filters.time) params.set("time", filters.time);
  if (showHidden) params.set("show", "hidden");
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/offers?${query}` : "/offers";
}
