import { canCancelBooking } from "@/lib/booking/cancel-rules";
import { db } from "@/lib/db";
import type { BookingStatus } from "@/lib/generated/prisma/enums";

// "My bookings" on the player's own profile (K.13 — the one piece of the
// booking epic's original plan that slipped through session 13: the
// request/decide/notify machinery shipped, but nowhere in the app could a
// player actually see a booking they'd made). Unlike lib/offers/my-games.ts
// (upcoming only — past games are the match history's job), this shows both:
// a declined or cancelled booking is still something the player needs to
// see, and there's no separate "booking history" anywhere else for it.

export type MyBooking = {
  id: string;
  status: BookingStatus;
  startsAt: Date;
  endsAt: Date;
  offerId: string | null;
  declineReason: string | null;
  court: { name: string };
  club: { id: string; name: string };
  /** Whether the player can still cancel this one themselves, right now. */
  canCancel: boolean;
};

const bookingSelect = {
  id: true,
  status: true,
  startsAt: true,
  endsAt: true,
  offerId: true,
  declineReason: true,
  court: {
    select: {
      name: true,
      club: { select: { id: true, name: true } },
    },
  },
} as const;

type BookingRow = {
  id: string;
  status: BookingStatus;
  startsAt: Date;
  endsAt: Date;
  offerId: string | null;
  declineReason: string | null;
  court: { name: string; club: { id: string; name: string } };
};

function toMyBooking(row: BookingRow, now: Date): MyBooking {
  return {
    id: row.id,
    status: row.status,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    offerId: row.offerId,
    declineReason: row.declineReason,
    court: { name: row.court.name },
    club: row.court.club,
    canCancel: canCancelBooking(row, now),
  };
}

export async function getMyBookings(
  userId: string,
  now: Date = new Date(),
): Promise<{ upcoming: MyBooking[]; past: MyBooking[] }> {
  const unsorted: BookingRow[] = await db.booking.findMany({
    where: { userId },
    select: bookingSelect,
    orderBy: { startsAt: "asc" },
  });
  // Sorted in JS too, not just trusted from the query (mirrors
  // my-games.ts's own belt-and-braces sort) — cheap, and keeps this correct
  // even if a future caller's mock or query change forgets the ordering.
  const rows = [...unsorted].sort(
    (a, b) => a.startsAt.getTime() - b.startsAt.getTime(),
  );

  const upcoming = rows
    .filter((row) => row.startsAt > now)
    .map((row) => toMyBooking(row, now));
  // Same ascending query, read backwards: most recent past booking first.
  const past = rows
    .filter((row) => row.startsAt <= now)
    .map((row) => toMyBooking(row, now))
    .reverse();

  return { upcoming, past };
}
