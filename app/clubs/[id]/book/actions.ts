"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";

import { canFit } from "@/lib/booking/availability";
import { getDayGrid } from "@/lib/booking/get-day-grid";
import { captureEvent } from "@/lib/analytics/posthog";
import { requireOnboardedUser } from "@/lib/auth/require-onboarded-user";
import { db } from "@/lib/db";
import { blockedRefusal } from "@/lib/moderation/block-rules";
import { notifyBookingRequested } from "@/lib/notifications/notify";
import { formatKrakowTimeRange, toKrakowLocal } from "@/lib/offers/krakow-time";
import { checkRateLimit } from "@/lib/rate-limit/check-rate-limit";
import { bookingRequestSchema } from "@/lib/validation/booking";

export type RequestBookingResult =
  { ok: true } | { ok: false; message: string };

/** K.10: at most this many requests still awaiting a staff decision. */
const MAX_PENDING_BOOKINGS = 3;

/**
 * A Postgres exclusion-violation (23P01) from the EXCLUDE constraint on
 * `bookings` (K.2) — two requests for the same slot raced past the
 * getDayGrid/canFit re-check below. Checked defensively across the shapes
 * Prisma 7 (no Rust engine) is seen to wrap a driver error in, since this
 * constraint isn't one Prisma's schema can express as a typed error code.
 */
function isExclusionViolation(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const direct = (error as { code?: unknown }).code;
  if (direct === "23P01") return true;
  const meta = (error as { meta?: { code?: unknown } }).meta;
  if (meta?.code === "23P01") return true;
  const cause = (error as { cause?: unknown }).cause;
  return (
    typeof cause === "object" &&
    cause !== null &&
    (cause as { code?: unknown }).code === "23P01"
  );
}

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
  const { courtId, startsAt, duration, note, offerId } = parsed.data;

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
  // "My bookings" (K.13) ships in the next PR — until then this just
  // returns the player to their profile, same as the club link above
  // 404s until K.16.
  redirect("/profile");
}
