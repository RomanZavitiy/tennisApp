import { z } from "zod";

import { District, OfferFormat, Surface } from "@/lib/generated/prisma/enums";
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
