import { z } from "zod";

import {
  CourtStatus,
  District,
  OfferFormat,
  Surface,
} from "@/lib/generated/prisma/enums";
import { krakowLocalToDate } from "@/lib/offers/krakow-time";
import { NTRP_LEVELS } from "@/lib/profile/options";

// A sparring offer: one schema for the form (3.5) and for the createOffer
// server action (3.4), which re-checks, since a request can skip the form.
// The database CHECKs from task 3.2 back up the same rules, except "starts in
// the future", which depends on the current time and lives only here.

export const COMMENT_MAX = 500;

// A form sends "" for an untouched select or an empty textarea; treat it as
// "not given", the same as a missing field.
const emptyToUndefined = (value: unknown) =>
  value === "" || value === null ? undefined : value;

const ntrpBound = z.preprocess(
  emptyToUndefined,
  z
    .number("Choose a level.")
    .refine((level) => NTRP_LEVELS.includes(level), "Choose a level.")
    .optional(),
);

export const offerSchema = z
  .object({
    format: z
      .enum(OfferFormat, "Choose singles or doubles.")
      .default("SINGLES"),
    hasPartner: z.boolean().default(false),
    // Kraków wall-clock time from <input type="datetime-local">, stored as
    // the UTC instant it means.
    startsAt: z
      .string("Choose the start time.")
      .transform((local, ctx) => {
        const date = krakowLocalToDate(local);
        if (!date) {
          ctx.addIssue({ code: "custom", message: "Choose the start time." });
          return z.NEVER;
        }
        return date;
      })
      .refine((date) => date > new Date(), "That time has already passed."),
    clubId: z.preprocess(
      emptyToUndefined,
      z.uuid("Choose a club from the list.").optional(),
    ),
    district: z.preprocess(
      emptyToUndefined,
      z.enum(District, "Choose a district.").optional(),
    ),
    ntrpMin: ntrpBound,
    ntrpMax: ntrpBound,
    surface: z.preprocess(
      emptyToUndefined,
      z.enum(Surface, "Choose a surface.").optional(),
    ),
    // Court status (task 3.22): whether the court is already booked.
    // Defaults to "will book once a partner is confirmed".
    courtStatus: z
      .enum(CourtStatus, "Choose the court status.")
      .default("WILL_BOOK"),
    // Trimmed first, so a comment of only spaces counts as none.
    comment: z.preprocess(
      (value) =>
        emptyToUndefined(typeof value === "string" ? value.trim() : value),
      z
        .string()
        .max(
          COMMENT_MAX,
          `Keep the comment under ${String(COMMENT_MAX)} characters.`,
        )
        .optional(),
    ),
  })
  .superRefine((offer, ctx) => {
    if (offer.hasPartner && offer.format !== "DOUBLES") {
      ctx.addIssue({
        code: "custom",
        path: ["hasPartner"],
        message: "A partner can only be added to a doubles game.",
      });
    }
    if (!offer.clubId && !offer.district) {
      ctx.addIssue({
        code: "custom",
        path: ["district"],
        message: "Choose a club or a district.",
      });
    }
    if (
      offer.ntrpMin !== undefined &&
      offer.ntrpMax !== undefined &&
      offer.ntrpMin > offer.ntrpMax
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["ntrpMax"],
        message: "The highest level can't be below the lowest.",
      });
    }
  });

export type OfferInput = z.input<typeof offerSchema>;
export type OfferValues = z.output<typeof offerSchema>;

// What createOffer returns when it doesn't redirect: the first message per
// field, for the form to show next to it (same shape as the profile form's).
export type CreateOfferResult = {
  ok: false;
  fieldErrors: Partial<Record<keyof OfferInput, string>>;
};

export function offerFieldErrors(error: z.ZodError): CreateOfferResult {
  const fieldErrors: CreateOfferResult["fieldErrors"] = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && field in offerSchema.shape) {
      fieldErrors[field as keyof OfferInput] ??= issue.message;
    }
  }
  return { ok: false, fieldErrors };
}
