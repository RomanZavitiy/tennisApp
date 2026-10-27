import { buildDayGrid, type CourtDayGrid } from "@/lib/booking/availability";
import { dayBounds } from "@/lib/booking/get-day-grid";
import { db } from "@/lib/db";
import { firstNameAndInitial } from "@/lib/privacy/opponent-name";

// The club staff panel's own loaders (K.16): the PENDING queue, and one
// day's grid annotated with who holds each taken slot — staff eyes only,
// so unlike lib/booking/get-day-grid.ts (the player-facing loader) this one
// is allowed to carry a name. `firstNameAndInitial` (lib/privacy/
// opponent-name.ts) is the same partial-name convention the rest of the
// app uses for anyone but yourself.

export type PendingBooking = {
  id: string;
  courtName: string;
  startsAt: Date;
  endsAt: Date;
  note: string | null;
  player: string;
};

/** Soonest first — the order staff should work through the queue. */
export async function getPendingQueue(
  clubId: string,
): Promise<PendingBooking[]> {
  const rows = await db.booking.findMany({
    where: { status: "PENDING", court: { clubId } },
    orderBy: { startsAt: "asc" },
    select: {
      id: true,
      startsAt: true,
      endsAt: true,
      note: true,
      court: { select: { name: true } },
      user: { select: { name: true } },
    },
  });
  return rows.map((row) => ({
    id: row.id,
    courtName: row.court.name,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    note: row.note,
    player: firstNameAndInitial(row.user.name),
  }));
}

export type NamedBooking = {
  id: string;
  courtId: string;
  startsAt: Date;
  endsAt: Date;
  status: "PENDING" | "CONFIRMED";
  player: string;
};

export type NamedBlock = {
  id: string;
  courtId: string;
  startsAt: Date;
  endsAt: Date;
  reason: string | null;
};

export type ClubPanelDay = {
  date: string;
  courts: { id: string; name: string }[];
  grid: CourtDayGrid[];
  bookings: NamedBooking[];
  blocks: NamedBlock[];
};

/** One day's grid for the panel (K.16), plus who holds each taken slot. */
export async function getClubPanelDay(
  clubId: string,
  date: string,
  now: Date = new Date(),
): Promise<ClubPanelDay | null> {
  const bounds = dayBounds(date);
  if (!bounds) return null;

  const club = await db.club.findFirst({
    where: { id: clubId, bookingMode: "SPINBUDDY" },
    select: {
      courts: {
        where: { active: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        select: { id: true, name: true },
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
        status: { in: ["PENDING", "CONFIRMED"] },
        startsAt: { lt: bounds.end },
        endsAt: { gt: bounds.start },
      },
      select: {
        id: true,
        courtId: true,
        startsAt: true,
        endsAt: true,
        status: true,
        user: { select: { name: true } },
      },
    }),
    db.courtBlock.findMany({
      where: {
        courtId: { in: courtIds },
        startsAt: { lt: bounds.end },
        endsAt: { gt: bounds.start },
      },
      select: {
        id: true,
        courtId: true,
        startsAt: true,
        endsAt: true,
        reason: true,
      },
    }),
  ]);

  const grid = buildDayGrid({
    date,
    hours: club.courtHours,
    courts: club.courts.map((court) => ({ id: court.id })),
    bookings: bookingRows,
    blocks: blockRows,
    now,
  });

  const bookings: NamedBooking[] = bookingRows.map((row) => ({
    id: row.id,
    courtId: row.courtId,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    status: row.status as "PENDING" | "CONFIRMED",
    player: firstNameAndInitial(row.user.name),
  }));

  return { date, courts: club.courts, grid, bookings, blocks: blockRows };
}

/** The booking (if any) covering a slot that starts at `slotStart` on this court — pure, for the grid to label a TAKEN cell with who holds it. */
export function bookingForSlot(
  bookings: NamedBooking[],
  courtId: string,
  slotStart: Date,
): NamedBooking | null {
  return (
    bookings.find(
      (booking) =>
        booking.courtId === courtId &&
        booking.startsAt.getTime() <= slotStart.getTime() &&
        slotStart.getTime() < booking.endsAt.getTime(),
    ) ?? null
  );
}

/** The block (if any) covering a slot that starts at `slotStart` on this court. */
export function blockForSlot(
  blocks: NamedBlock[],
  courtId: string,
  slotStart: Date,
): NamedBlock | null {
  return (
    blocks.find(
      (block) =>
        block.courtId === courtId &&
        block.startsAt.getTime() <= slotStart.getTime() &&
        slotStart.getTime() < block.endsAt.getTime(),
    ) ?? null
  );
}
