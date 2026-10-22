import { z } from "zod";

import { krakowLocalToDate } from "@/lib/offers/krakow-time";

// The club staff panel's own inputs (slice K, K.15-K.19): a block staff add
// by hand for a booking made outside SpinBuddy (phone, twojtenis) or for
// maintenance, and the reason a staff member gives when declining a
// request. Both share the 300-char cap Booking.declineReason and
// CourtBlock.reason use (K.2).

export const CLUB_PANEL_REASON_MAX = 300;

type ValidationT = (key: string, values?: Record<string, number>) => string;

const emptyToUndefined = (value: unknown) =>
  value === "" || value === null ? undefined : value;

function reasonSchema(t: ValidationT) {
  return z.preprocess(
    (value) =>
      emptyToUndefined(typeof value === "string" ? value.trim() : value),
    z
      .string()
      .max(
        CLUB_PANEL_REASON_MAX,
        t("reasonTooLong", { max: CLUB_PANEL_REASON_MAX }),
      )
      .optional(),
  );
}

/** `t` is a translator for the "Validation.declineBooking" namespace. */
export function declineReasonSchema(t: ValidationT) {
  return reasonSchema(t);
}

function localDateTime(t: ValidationT, key: string) {
  return z.string(t(key)).transform((local, ctx) => {
    const date = krakowLocalToDate(local);
    if (!date) {
      ctx.addIssue({ code: "custom", message: t(key) });
      return z.NEVER;
    }
    return date;
  });
}

/** `t` is a translator for the "Validation.addBlock" namespace. */
export function addBlockSchema(t: ValidationT) {
  return z
    .object({
      courtId: z.uuid(t("courtRequired")),
      startsAt: localDateTime(t, "startsAtRequired"),
      endsAt: localDateTime(t, "endsAtRequired"),
      reason: reasonSchema(t),
    })
    .refine((data) => data.startsAt < data.endsAt, {
      message: t("endBeforeStart"),
      path: ["endsAt"],
    });
}

export type AddBlockInput = z.input<ReturnType<typeof addBlockSchema>>;
export type AddBlockValues = z.output<ReturnType<typeof addBlockSchema>>;
