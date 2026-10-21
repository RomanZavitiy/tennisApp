import { krakowLocalToDate } from "@/lib/offers/krakow-time";

// A club's day, as a grid of courts × time slots (slice K, v1 — decision
// 2026-10-21). Pure: every "now" and every row of hours/bookings/blocks is
// passed in, nothing is read from a clock or a database here — that's the
// caller's job, so this stays easy to test across both DST transitions.

export type SlotStatus = "FREE" | "TAKEN" | "PAST" | "CLOSED";

export type DaySlot = {
  start: Date;
  end: Date;
  status: SlotStatus;
};

export type CourtDayGrid = {
  courtId: string;
  slots: DaySlot[];
};

/** One weekday's opening hours for a club (K.2's CourtHours row). */
export type CourtHoursInput = {
  /** 0 (Sunday) – 6 (Saturday), matching `Date#getUTCDay()`. */
  weekday: number;
  /** Minutes from midnight, on the club's own (Europe/Warsaw) clock. */
  opensAt: number;
  closesAt: number;
};

/** The two statuses that actually hold a slot — a declined or cancelled
 * request never blocked it, so it isn't one of these (K.2's EXCLUDE
 * constraint uses the same two statuses). */
type BlockingBookingStatus = "PENDING" | "CONFIRMED";
const BLOCKING_BOOKING_STATUSES: BlockingBookingStatus[] = [
  "PENDING",
  "CONFIRMED",
];

export type BookingInput = {
  courtId: string;
  startsAt: Date;
  endsAt: Date;
  status: "PENDING" | "CONFIRMED" | "DECLINED" | "CANCELLED";
};

export type CourtBlockInput = {
  courtId: string;
  startsAt: Date;
  endsAt: Date;
};

export type BuildDayGridInput = {
  /** The calendar date to render, in Kraków — `todayInKrakow()`'s format. */
  date: string;
  /** The club's opening hours; a weekday with no row here is closed all day. */
  hours: CourtHoursInput[];
  courts: { id: string }[];
  bookings: BookingInput[];
  blocks: CourtBlockInput[];
  now: Date;
  slotMinutes?: number;
};

const DEFAULT_SLOT_MINUTES = 30;
const MINUTES_PER_DAY = 24 * 60;

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}

function minutesToLocal(date: string, minutesFromMidnight: number): string {
  const hh = String(Math.floor(minutesFromMidnight / 60)).padStart(2, "0");
  const mm = String(minutesFromMidnight % 60).padStart(2, "0");
  return `${date}T${hh}:${mm}`;
}

type Window = { start: Date; end: Date; open: boolean };

/**
 * Every `slotMinutes` window across the full calendar day, each tagged with
 * whether it falls inside the club's opening hours for that weekday. Shared
 * across every court — hours are club-wide (K.2), not per-court.
 */
function buildDayWindows(
  date: string,
  todaysHours: CourtHoursInput | undefined,
  slotMinutes: number,
): Window[] {
  const windows: Window[] = [];
  for (
    let minute = 0;
    minute + slotMinutes <= MINUTES_PER_DAY;
    minute += slotMinutes
  ) {
    const start = krakowLocalToDate(minutesToLocal(date, minute));
    // A wall-clock label that doesn't exist (the hour skipped every spring)
    // can't be represented as a slot — skip it rather than guess. The end
    // is plain instant arithmetic on `start`, not a second local-time
    // lookup: the label `slotMinutes` later (e.g. "02:00" the night clocks
    // go forward) can itself be unrepresentable even when `start` isn't.
    if (!start) continue;
    const end = new Date(start.getTime() + slotMinutes * 60_000);
    const open =
      todaysHours !== undefined &&
      minute >= todaysHours.opensAt &&
      minute + slotMinutes <= todaysHours.closesAt;
    windows.push({ start, end, open });
  }
  return windows;
}

/**
 * A day's booking grid for a set of courts at one club: every half-hour (by
 * default) slot, as FREE, TAKEN (a booking or block covers it), PAST
 * (already started relative to `now`), or CLOSED (outside the club's hours
 * for that weekday, including a weekday with no hours row at all).
 *
 * Status priority is CLOSED, then PAST, then TAKEN, then FREE: a slot
 * outside opening hours is CLOSED even if it's also in the past, and a past
 * slot reads as PAST even if something was booked in it.
 */
export function buildDayGrid({
  date,
  hours,
  courts,
  bookings,
  blocks,
  now,
  slotMinutes = DEFAULT_SLOT_MINUTES,
}: BuildDayGridInput): CourtDayGrid[] {
  // The day of the week is a property of the calendar date itself, not of
  // any particular instant — no timezone conversion needed here, unlike the
  // slot boundaries below.
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
  const todaysHours = hours.find((h) => h.weekday === weekday);
  const windows = buildDayWindows(date, todaysHours, slotMinutes);

  return courts.map((court) => {
    const courtBookings = bookings.filter(
      (b) =>
        b.courtId === court.id &&
        BLOCKING_BOOKING_STATUSES.includes(b.status as BlockingBookingStatus),
    );
    const courtBlocks = blocks.filter((b) => b.courtId === court.id);

    const slots: DaySlot[] = windows.map(({ start, end, open }) => {
      let status: SlotStatus;
      if (!open) {
        status = "CLOSED";
      } else if (start.getTime() < now.getTime()) {
        status = "PAST";
      } else if (
        courtBookings.some((b) => overlaps(start, end, b.startsAt, b.endsAt)) ||
        courtBlocks.some((b) => overlaps(start, end, b.startsAt, b.endsAt))
      ) {
        status = "TAKEN";
      } else {
        status = "FREE";
      }
      return { start, end, status };
    });

    return { courtId: court.id, slots };
  });
}

/**
 * Whether a court can take a booking of `durationMinutes` starting at
 * `start`: every `slotMinutes`-sized slot the booking would cover must
 * exist in the grid and be FREE. `slotMinutes` must match the grid's own
 * (both default to 30) — a grid built with a different size doesn't line
 * up with `start` the same way.
 */
export function canFit(
  grid: CourtDayGrid[],
  courtId: string,
  start: Date,
  durationMinutes: number,
  slotMinutes: number = DEFAULT_SLOT_MINUTES,
): boolean {
  const court = grid.find((c) => c.courtId === courtId);
  if (!court) return false;

  const slotCount = durationMinutes / slotMinutes;
  if (!Number.isInteger(slotCount) || slotCount <= 0) return false;

  for (let i = 0; i < slotCount; i++) {
    const expectedStart = new Date(start.getTime() + i * slotMinutes * 60_000);
    const slot = court.slots.find(
      (s) => s.start.getTime() === expectedStart.getTime(),
    );
    if (!slot || slot.status !== "FREE") return false;
  }
  return true;
}
