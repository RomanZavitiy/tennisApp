import { z } from "zod";

import { krakowLocalToDate } from "@/lib/offers/krakow-time";

// A court booking request (slice K, v1 — decision 2026-10-21): one schema
// for the booking form and for the server action that creates it, since a
// request can skip the form. Mirrors offerSchema's startsAt handling
// (lib/validation/offer.ts) and the Postgres CHECKs from K.2.

export const BOOKING_DURATIONS = [60, 90, 120] as const;
export type BookingDuration = (typeof BOOKING_DURATIONS)[number];

export function isBookingDuration(value: number): value is BookingDuration {
  return (BOOKING_DURATIONS as readonly number[]).includes(value);
}

export const BOOKING_NOTE_MAX = 300;

/** How far ahead a booking can start (K.3): today plus this many days. */
export const BOOKING_MAX_DAYS_AHEAD = 14;

type ValidationT = (key: string, values?: Record<string, number>) => string;

// A form sends "" for an untouched field; treat it as "not given", the same
// as a missing one (same helper as offerSchema's).
const emptyToUndefined = (value: unknown) =>
  value === "" || value === null ? undefined : value;

/** `t` is a translator for the "Validation.booking" namespace. */
export function bookingRequestSchema(t: ValidationT) {
  return z.object({
    courtId: z.uuid(t("courtRequired")),
    // Kraków wall-clock time from <input type="datetime-local">, stored as
    // the UTC instant it means (same convention as offerSchema's startsAt).
    // Poland's UTC offset is always a whole number of hours, so a Kraków
    // time on the hour or half hour is also on the hour or half hour in
    // UTC — checking getUTCMinutes() needs no second timezone conversion.
    startsAt: z
      .string(t("startsAtRequired"))
      .transform((local, ctx) => {
        const date = krakowLocalToDate(local);
        if (!date) {
          ctx.addIssue({ code: "custom", message: t("startsAtRequired") });
          return z.NEVER;
        }
        return date;
      })
      .refine(
        (date) => date.getUTCMinutes() % 30 === 0,
        t("startsAtNotAligned"),
      )
      .refine((date) => date > new Date(), t("startsAtPast"))
      .refine(
        (date) =>
          date.getTime() <=
          Date.now() + BOOKING_MAX_DAYS_AHEAD * 24 * 60 * 60 * 1000,
        t("startsAtTooFarAhead"),
      ),
    duration: z.preprocess(
      (value) => (value === "" || value == null ? undefined : Number(value)),
      z
        .number(t("durationRequired"))
        .refine(isBookingDuration, t("durationRequired")),
    ),
    note: z.preprocess(
      (value) =>
        emptyToUndefined(typeof value === "string" ? value.trim() : value),
      z
        .string()
        .max(BOOKING_NOTE_MAX, t("noteTooLong", { max: BOOKING_NOTE_MAX }))
        .optional(),
    ),
    offerId: z.preprocess(
      emptyToUndefined,
      z.uuid(t("offerInvalid")).optional(),
    ),
  });
}

export type BookingRequestInput = z.input<
  ReturnType<typeof bookingRequestSchema>
>;
export type BookingRequestValues = z.output<
  ReturnType<typeof bookingRequestSchema>
>;

// What a booking-creating server action returns when it doesn't redirect:
// the first message per field, for the form to show next to it (same shape
// as offerSchema's CreateOfferResult).
export type CreateBookingResult = {
  ok: false;
  fieldErrors: Partial<Record<keyof BookingRequestInput, string>>;
  message?: string;
};

const BOOKING_FIELDS = new Set<keyof BookingRequestInput>([
  "courtId",
  "startsAt",
  "duration",
  "note",
  "offerId",
]);

export function bookingRequestFieldErrors(
  error: z.ZodError,
): CreateBookingResult {
  const fieldErrors: CreateBookingResult["fieldErrors"] = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (
      typeof field === "string" &&
      BOOKING_FIELDS.has(field as keyof BookingRequestInput)
    ) {
      fieldErrors[field as keyof BookingRequestInput] ??= issue.message;
    }
  }
  return { ok: false, fieldErrors };
}
