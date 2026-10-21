import { z } from "zod";

import {
  buildDayGrid,
  type BookingInput,
  type CourtBlockInput,
  type CourtDayGrid,
  type CourtHoursInput,
} from "@/lib/booking/availability";
import { db } from "@/lib/db";
import type { Surface } from "@/lib/generated/prisma/enums";
import { krakowLocalToDate } from "@/lib/offers/krakow-time";

// The booking grid page's one server loader (slice K): a club/day's courts,
// hours, bookings and blocks, already folded into buildDayGrid's output.
// Not SPINBUDDY, or no such club, both read as "nothing to book" — the page
// (K.8) turns either into a 404, this module doesn't know what a 404 is.

export type DayGridCourt = {
  id: string;
  name: string;
  surface: Surface;
  indoor: boolean;
  pricePerHourPln: number | null;
};

export type DayGrid = {
  club: { id: string; name: string };
  courts: DayGridCourt[];
  grid: CourtDayGrid[];
};

const BLOCKING_BOOKING_STATUSES: ("PENDING" | "CONFIRMED")[] = [
  "PENDING",
  "CONFIRMED",
];

/** The calendar date's first instant, the next day's first instant. */
function dayBounds(date: string): { start: Date; end: Date } | null {
  const start = krakowLocalToDate(`${date}T00:00`);
  if (!start) return null;
  const next = new Date(`${date}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  const end = krakowLocalToDate(`${next.toISOString().slice(0, 10)}T00:00`);
  if (!end) return null;
  return { start, end };
}

export async function getDayGrid(
  clubId: string,
  date: string,
  now: Date = new Date(),
): Promise<DayGrid | null> {
  if (!z.uuid().safeParse(clubId).success) return null;
  const bounds = dayBounds(date);
  if (!bounds) return null;

  const club = await db.club.findFirst({
    where: { id: clubId, bookingMode: "SPINBUDDY" },
    select: {
      id: true,
      name: true,
      courts: {
        where: { active: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          surface: true,
          indoor: true,
          pricePerHourPln: true,
        },
      },
      courtHours: { select: { weekday: true, opensAt: true, closesAt: true } },
    },
  });
  if (!club) return null;

  const courtIds = club.courts.map((court) => court.id);
  const [bookingRows, blockRows] = await Promise.all([
    db.booking.findMany({
      where: {
        courtId: { in: courtIds },
        status: { in: BLOCKING_BOOKING_STATUSES },
        startsAt: { lt: bounds.end },
        endsAt: { gt: bounds.start },
      },
      select: { courtId: true, startsAt: true, endsAt: true, status: true },
    }),
    db.courtBlock.findMany({
      where: {
        courtId: { in: courtIds },
        startsAt: { lt: bounds.end },
        endsAt: { gt: bounds.start },
      },
      select: { courtId: true, startsAt: true, endsAt: true },
    }),
  ]);

  const hours: CourtHoursInput[] = club.courtHours;
  const bookings: BookingInput[] = bookingRows;
  const blocks: CourtBlockInput[] = blockRows;

  const grid = buildDayGrid({
    date,
    hours,
    courts: club.courts.map((court) => ({ id: court.id })),
    bookings,
    blocks,
    now,
  });

  return { club: { id: club.id, name: club.name }, courts: club.courts, grid };
}
