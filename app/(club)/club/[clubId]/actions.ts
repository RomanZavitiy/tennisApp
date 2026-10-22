"use server";

import { revalidatePath } from "next/cache";
import { getFormatter, getTranslations } from "next-intl/server";
import { z } from "zod";

import { captureEvent } from "@/lib/analytics/posthog";
import { requireClubStaff } from "@/lib/auth/require-club-staff";
import { isExclusionViolation } from "@/lib/booking/db-errors";
import { bookingDurationMinutes } from "@/lib/booking/duration";
import { db } from "@/lib/db";
import { formatKrakowTimeRange } from "@/lib/offers/krakow-time";
import { markOfferCourtBooked } from "@/lib/offers/mark-court-booked";
import { notifyBookingDecided } from "@/lib/notifications/notify";
import {
  addBlockSchema,
  declineReasonSchema,
} from "@/lib/validation/club-panel";

// The club staff panel's four actions (K.17): confirm/decline a PENDING
// request, add/remove a CourtBlock for a booking made outside SpinBuddy
// (phone, twojtenis) or for maintenance. Every one starts by loading the
// row to learn its clubId, then requireClubStaff(clubId) — the page's own
// 404 (K.15) is only the first gate, same "every action checks the role
// too" rule as app/admin/actions.ts.

export type ClubPanelActionResult =
  { ok: true } | { ok: false; message: string };

async function overlapsABooking(
  courtId: string,
  startsAt: Date,
  endsAt: Date,
): Promise<boolean> {
  const count = await db.booking.count({
    where: {
      courtId,
      status: { in: ["PENDING", "CONFIRMED"] },
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt },
    },
  });
  return count > 0;
}

/**
 * K.17: a staff member accepts a request. Takes no reason — unlike
 * declineBooking, there's nothing to tell the player — but still binds
 * fine into components/admin-action-form.tsx's shared `(reason) =>
 * Promise<Result>` shape: a bound 1-arg function ignores the extra arg.
 */
export async function confirmBooking(
  bookingId: unknown,
): Promise<ClubPanelActionResult> {
  const tErrors = await getTranslations("Errors");
  const id = z.uuid().safeParse(bookingId);
  if (!id.success) {
    return { ok: false, message: tErrors("bookingNotFound") };
  }

  const booking = await db.booking.findUnique({
    where: { id: id.data },
    select: {
      id: true,
      status: true,
      startsAt: true,
      endsAt: true,
      userId: true,
      offerId: true,
      court: { select: { id: true, name: true, clubId: true } },
    },
  });
  if (!booking) {
    return { ok: false, message: tErrors("bookingNotFound") };
  }
  const staff = await requireClubStaff(booking.court.clubId);
  if (booking.status !== "PENDING") {
    return { ok: false, message: tErrors("bookingAlreadyDecided") };
  }

  await db.booking.update({
    where: { id: booking.id },
    data: { status: "CONFIRMED", decidedById: staff.id, decidedAt: new Date() },
  });
  // K.21: this request came from an offer's page — the same "court booked"
  // write and notifications markCourtBooked does when the author marks it
  // by hand.
  if (booking.offerId) {
    await markOfferCourtBooked(booking.offerId, staff.id);
  }

  const format = await getFormatter();
  await notifyBookingDecided(booking.userId, {
    court: booking.court.name,
    timeRange: formatKrakowTimeRange(
      format,
      booking.startsAt,
      bookingDurationMinutes(booking.startsAt, booking.endsAt),
    ),
    status: "CONFIRMED",
  });
  await captureEvent("booking_confirmed", staff.id, {});
  revalidatePath(`/club/${booking.court.clubId}`);
  if (booking.offerId) {
    revalidatePath(`/offers/${booking.offerId}`);
  }
  return { ok: true };
}

/** K.17: a staff member refuses a request, with an optional reason shown to the player. */
export async function declineBooking(
  bookingId: unknown,
  reason?: string,
): Promise<ClubPanelActionResult> {
  const tErrors = await getTranslations("Errors");
  const id = z.uuid().safeParse(bookingId);
  if (!id.success) {
    return { ok: false, message: tErrors("bookingNotFound") };
  }

  const booking = await db.booking.findUnique({
    where: { id: id.data },
    select: {
      id: true,
      status: true,
      startsAt: true,
      endsAt: true,
      userId: true,
      court: { select: { id: true, name: true, clubId: true } },
    },
  });
  if (!booking) {
    return { ok: false, message: tErrors("bookingNotFound") };
  }
  const staff = await requireClubStaff(booking.court.clubId);
  if (booking.status !== "PENDING") {
    return { ok: false, message: tErrors("bookingAlreadyDecided") };
  }

  const tValidation = await getTranslations("Validation.declineBooking");
  const parsedReason = declineReasonSchema(tValidation).safeParse(reason);
  if (!parsedReason.success) {
    return {
      ok: false,
      message:
        parsedReason.error.issues[0]?.message ?? tErrors("invalidRequest"),
    };
  }
  const declineReason = parsedReason.data;

  await db.booking.update({
    where: { id: booking.id },
    data: {
      status: "DECLINED",
      declineReason,
      decidedById: staff.id,
      decidedAt: new Date(),
    },
  });

  const format = await getFormatter();
  await notifyBookingDecided(booking.userId, {
    court: booking.court.name,
    timeRange: formatKrakowTimeRange(
      format,
      booking.startsAt,
      bookingDurationMinutes(booking.startsAt, booking.endsAt),
    ),
    status: "DECLINED",
    reason: declineReason,
  });
  await captureEvent("booking_declined", staff.id, {});
  revalidatePath(`/club/${booking.court.clubId}`);
  return { ok: true };
}

/**
 * K.17: a block for a booking made outside SpinBuddy, or for maintenance.
 * Refused if it would overlap a PENDING/CONFIRMED booking — staff decide
 * that one first (confirm or decline it), rather than the block silently
 * taking priority.
 */
export async function addBlock(input: unknown): Promise<ClubPanelActionResult> {
  const tErrors = await getTranslations("Errors");
  const tValidation = await getTranslations("Validation.addBlock");
  const parsed = addBlockSchema(tValidation).safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? tErrors("invalidRequest"),
    };
  }
  const { courtId, startsAt, endsAt, reason } = parsed.data;

  const court = await db.court.findUnique({
    where: { id: courtId },
    select: { id: true, clubId: true },
  });
  if (!court) {
    return { ok: false, message: tErrors("courtNotFound") };
  }
  const staff = await requireClubStaff(court.clubId);

  if (await overlapsABooking(court.id, startsAt, endsAt)) {
    return { ok: false, message: tErrors("blockOverlapsBooking") };
  }

  try {
    await db.courtBlock.create({
      data: {
        courtId: court.id,
        startsAt,
        endsAt,
        reason,
        createdById: staff.id,
      },
    });
  } catch (error) {
    // The EXCLUDE constraint on court_blocks (K.2, no WHERE) is the actual
    // backstop against two staff adding overlapping blocks at once — the
    // check above only catches an overlap with a booking.
    if (isExclusionViolation(error)) {
      return { ok: false, message: tErrors("blockOverlapsBlock") };
    }
    throw error;
  }
  revalidatePath(`/club/${court.clubId}`);
  return { ok: true };
}

/** K.17: lifts a block early. Takes no reason — same as confirmBooking. */
export async function removeBlock(
  blockId: unknown,
): Promise<ClubPanelActionResult> {
  const tErrors = await getTranslations("Errors");
  const id = z.uuid().safeParse(blockId);
  if (!id.success) {
    return { ok: false, message: tErrors("blockNotFound") };
  }

  const block = await db.courtBlock.findUnique({
    where: { id: id.data },
    select: { id: true, court: { select: { clubId: true } } },
  });
  if (!block) {
    return { ok: false, message: tErrors("blockNotFound") };
  }
  await requireClubStaff(block.court.clubId);

  await db.courtBlock.delete({ where: { id: block.id } });
  revalidatePath(`/club/${block.court.clubId}`);
  return { ok: true };
}
