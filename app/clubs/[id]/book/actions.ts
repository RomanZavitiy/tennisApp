"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { z } from "zod";

import { canFit } from "@/lib/booking/availability";
import { canCancelBooking } from "@/lib/booking/cancel-rules";
import { isExclusionViolation } from "@/lib/booking/db-errors";
import { bookingDurationMinutes } from "@/lib/booking/duration";
import { getDayGrid } from "@/lib/booking/get-day-grid";
import { captureEvent } from "@/lib/analytics/posthog";
import { requireOnboardedUser } from "@/lib/auth/require-onboarded-user";
import { db } from "@/lib/db";
import { blockedRefusal } from "@/lib/moderation/block-rules";
import {
  notifyBookingCancelled,
  notifyBookingRequested,
} from "@/lib/notifications/notify";
import { formatKrakowTimeRange, toKrakowLocal } from "@/lib/offers/krakow-time";
import { checkRateLimit } from "@/lib/rate-limit/check-rate-limit";
import { bookingRequestSchema } from "@/lib/validation/booking";

export type RequestBookingResult =
  { ok: true } | { ok: false; message: string };

/** K.10: at most this many requests still awaiting a staff decision. */
const MAX_PENDING_BOOKINGS = 3;

/**
 * Sends a booking request from the grid (K.8): the player's own id, never
 * one from the request. Re-checks the slot is still free right before
 * writing — the grid the player saw may be a few seconds stale — and the
 * EXCLUDE constraint (K.2) is the actual backstop if two requests still
 * race past that check.
 */
export async function requestBooking(
  input: unknown,
): Promise<RequestBookingResult> {
  const player = await requireOnboardedUser();
  const tErrors = await getTranslations("Errors");

  const blocked = blockedRefusal(tErrors, player);
  if (blocked) {
    return { ok: false, message: blocked };
  }

  const tValidation = await getTranslations("Validation.booking");
  const parsed = bookingRequestSchema(tValidation).safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? tErrors("invalidRequest"),
    };
  }
  const { courtId, startsAt, duration, note } = parsed.data;

  // K.21: only link the offer back to this booking when the requester is
  // actually its author — a borrowed id from someone else's offer (the URL
  // a non-author could still reach the grid with) never gets stored.
  let offerId: string | undefined;
  if (parsed.data.offerId) {
    const linkedOffer = await db.sparringOffer.findUnique({
      where: { id: parsed.data.offerId },
      select: { authorId: true },
    });
    if (linkedOffer?.authorId === player.id) {
      offerId = parsed.data.offerId;
    }
  }

  const limited = await checkRateLimit(player.id, "BOOKING_REQUEST");
  if (!limited.ok) {
    const tRateLimit = await getTranslations("RateLimit");
    return { ok: false, message: tRateLimit("BOOKING_REQUEST") };
  }

  const pendingCount = await db.booking.count({
    where: { userId: player.id, status: "PENDING" },
  });
  if (pendingCount >= MAX_PENDING_BOOKINGS) {
    return {
      ok: false,
      message: tErrors("tooManyPendingBookings", {
        max: MAX_PENDING_BOOKINGS,
      }),
    };
  }

  const court = await db.court.findUnique({
    where: { id: courtId },
    select: { id: true, name: true, active: true, clubId: true },
  });
  if (!court || !court.active) {
    return { ok: false, message: tErrors("courtNotFound") };
  }

  // The slot the player saw on the grid a moment ago, re-read now.
  const day = await getDayGrid(
    court.clubId,
    toKrakowLocal(startsAt).slice(0, 10),
  );
  if (!day || !canFit(day.grid, court.id, startsAt, duration)) {
    return { ok: false, message: tErrors("slotTaken") };
  }

  const endsAt = new Date(startsAt.getTime() + duration * 60_000);
  try {
    await db.booking.create({
      data: {
        courtId: court.id,
        userId: player.id,
        startsAt,
        endsAt,
        note,
        offerId,
      },
    });
  } catch (error) {
    if (isExclusionViolation(error)) {
      return { ok: false, message: tErrors("slotTaken") };
    }
    throw error;
  }

  // K.12: every staff member of this club, never blocking the redirect
  // below on a notification failure (notifyBookingRequested() never throws).
  const staff = await db.clubStaff.findMany({
    where: { clubId: court.clubId },
    select: { userId: true },
  });
  const format = await getFormatter();
  const timeRange = formatKrakowTimeRange(format, startsAt, duration);
  await Promise.all(
    staff.map((member) =>
      notifyBookingRequested(member.userId, {
        clubId: court.clubId,
        court: court.name,
        timeRange,
      }),
    ),
  );

  await captureEvent("booking_requested", player.id, {});

  revalidatePath(`/clubs/${court.clubId}/book`);
  // "My bookings" (K.13) hasn't shipped — until it does this just returns
  // the player to their profile, same as the club link above 404s until K.16.
  redirect("/profile");
}

/**
 * K.22: the player cancels their own booking — reached today only from the
 * offer it was made for ("Cancel booking too"), a separate, explicit action
 * from cancelling the offer itself. Own booking, PENDING/CONFIRMED, outside
 * the cancel window (lib/booking/cancel-rules.ts). A CONFIRMED one notifies
 * club staff — they'd already greenlit it; a PENDING one just disappears
 * from their queue.
 */
export async function cancelBooking(
  bookingId: unknown,
): Promise<RequestBookingResult> {
  const player = await requireOnboardedUser();
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
  if (!booking || booking.userId !== player.id) {
    return { ok: false, message: tErrors("bookingNotFound") };
  }
  if (booking.status !== "PENDING" && booking.status !== "CONFIRMED") {
    return { ok: false, message: tErrors("bookingNotActive") };
  }
  if (!canCancelBooking(booking, new Date())) {
    return { ok: false, message: tErrors("bookingCancelWindowPassed") };
  }

  const wasConfirmed = booking.status === "CONFIRMED";
  await db.booking.update({
    where: { id: booking.id },
    data: { status: "CANCELLED" },
  });

  if (wasConfirmed) {
    const staff = await db.clubStaff.findMany({
      where: { clubId: booking.court.clubId },
      select: { userId: true },
    });
    const format = await getFormatter();
    const timeRange = formatKrakowTimeRange(
      format,
      booking.startsAt,
      bookingDurationMinutes(booking.startsAt, booking.endsAt),
    );
    await Promise.all(
      staff.map((member) =>
        notifyBookingCancelled(member.userId, {
          clubId: booking.court.clubId,
          court: booking.court.name,
          timeRange,
        }),
      ),
    );
  }

  await captureEvent("booking_cancelled", player.id, {});
  revalidatePath(`/clubs/${booking.court.clubId}/book`);
  revalidatePath(`/club/${booking.court.clubId}`);
  if (booking.offerId) {
    revalidatePath(`/offers/${booking.offerId}`);
  }
  return { ok: true };
}
