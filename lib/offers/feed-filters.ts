import { z } from "zod";

import type { Prisma } from "@/lib/generated/prisma/client";
import { District, OfferFormat } from "@/lib/generated/prisma/enums";
import { krakowLocalToDate } from "@/lib/offers/krakow-time";
import { NTRP_LEVELS } from "@/lib/profile/options";

// Feed filters (task 3.7). They live in the URL (/offers?date=…&district=…),
// so a filtered feed can be shared and "back" works; the server reads them
// here and turns them into the query. A value that doesn't parse is ignored
// rather than an error — a hand-edited or outdated link still shows a feed.

export type FeedFilters = {
  /** A Kraków calendar day, "YYYY-MM-DD". */
  date?: string;
  district?: District;
  /** The player's level: offers whose NTRP range includes it. */
  ntrp?: number;
  format?: OfferFormat;
  /** Only offers whose court is already booked (task 3.22). */
  courtBooked?: boolean;
};

type SearchParams = Record<string, string | string[] | undefined>;

const fields = {
  date: z.iso.date(),
  district: z.enum(District),
  ntrp: z.coerce.number().refine((level) => NTRP_LEVELS.includes(level)),
  format: z.enum(OfferFormat),
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

  return { AND: conditions };
}

/** A link to the feed with these filters, on this page (page 1 is left out). */
export function feedHref(filters: FeedFilters, page = 1): string {
  const params = new URLSearchParams();
  if (filters.date) params.set("date", filters.date);
  if (filters.district) params.set("district", filters.district);
  if (filters.ntrp !== undefined) params.set("ntrp", filters.ntrp.toFixed(1));
  if (filters.format) params.set("format", filters.format);
  if (filters.courtBooked) params.set("courtBooked", "1");
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/offers?${query}` : "/offers";
}
