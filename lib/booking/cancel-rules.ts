import type { BookingStatus } from "@/lib/generated/prisma/enums";

// When a player may cancel their own booking (K.22, mirrors
// lib/offers/cancel-rules.ts): while it's still PENDING or CONFIRMED, and
// not within the window right before the start — too late to free the slot
// for someone else.

/** Owner suggestion from the epic's checklist; no product data yet to tune it. */
export const BOOKING_CANCEL_WINDOW_HOURS = 12;

export function canCancelBooking(
  booking: { status: BookingStatus; startsAt: Date },
  now: Date,
): boolean {
  if (booking.status !== "PENDING" && booking.status !== "CONFIRMED") {
    return false;
  }
  return (
    booking.startsAt.getTime() - now.getTime() >
    BOOKING_CANCEL_WINDOW_HOURS * 3_600_000
  );
}
