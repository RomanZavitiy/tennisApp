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

type ValidationT = (key: string, values?: Record<string, number>) => string;

// A form sends "" for an untouched select or an empty textarea; treat it as
// "not given", the same as a missing field.
const emptyToUndefined = (value: unknown) =>
  value === "" || value === null ? undefined : value;

/** `t` is a translator for the "Validation.offer" namespace (task 1.20). */
export function offerSchema(t: ValidationT) {
  const ntrpBound = z.preprocess(
    emptyToUndefined,
    z
      .number(t("levelRequired"))
      .refine((level) => NTRP_LEVELS.includes(level), t("levelRequired"))
      .optional(),
  );

  return z
    .object({
      format: z.enum(OfferFormat, t("formatRequired")).default("SINGLES"),
      hasPartner: z.boolean().default(false),
      // Kraków wall-clock time from <input type="datetime-local">, stored as
      // the UTC instant it means.
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
        .refine((date) => date > new Date(), t("startsAtPast")),
      clubId: z.preprocess(
        emptyToUndefined,
        z.uuid(t("clubRequired")).optional(),
      ),
      district: z.preprocess(
        emptyToUndefined,
        z.enum(District, t("districtRequired")).optional(),
      ),
      ntrpMin: ntrpBound,
      ntrpMax: ntrpBound,
      surface: z.preprocess(
        emptyToUndefined,
        z.enum(Surface, t("surfaceRequired")).optional(),
      ),
      // Court status (task 3.22): whether the court is already booked.
      // Defaults to "will book once a partner is confirmed".
      courtStatus: z
        .enum(CourtStatus, t("courtStatusRequired"))
        .default("WILL_BOOK"),
      // Trimmed first, so a comment of only spaces counts as none.
      comment: z.preprocess(
        (value) =>
          emptyToUndefined(typeof value === "string" ? value.trim() : value),
        z
          .string()
          .max(COMMENT_MAX, t("commentTooLong", { max: COMMENT_MAX }))
          .optional(),
      ),
    })
    .superRefine((offer, ctx) => {
      if (offer.hasPartner && offer.format !== "DOUBLES") {
        ctx.addIssue({
          code: "custom",
          path: ["hasPartner"],
          message: t("partnerNeedsDoubles"),
        });
      }
      if (!offer.clubId && !offer.district) {
        ctx.addIssue({
          code: "custom",
          path: ["district"],
          message: t("clubOrDistrictRequired"),
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
          message: t("levelRangeInverted"),
        });
      }
    });
}

export type OfferInput = z.input<ReturnType<typeof offerSchema>>;
export type OfferValues = z.output<ReturnType<typeof offerSchema>>;

// What createOffer returns when it doesn't redirect: the first message per
// field, for the form to show next to it (same shape as the profile form's).
// `message` is for a refusal that isn't about any one field — blocked
// (6.4), the active-offer limit or the daily rate limit (6.16-6.18).
export type CreateOfferResult = {
  ok: false;
  fieldErrors: Partial<Record<keyof OfferInput, string>>;
  message?: string;
};

// The schema is now a function (it needs a translator), so this can't read
// `.shape` off it any more; the field set is static anyway.
const OFFER_FIELDS = new Set<keyof OfferInput>([
  "format",
  "hasPartner",
  "startsAt",
  "clubId",
  "district",
  "ntrpMin",
  "ntrpMax",
  "surface",
  "courtStatus",
  "comment",
]);

export function offerFieldErrors(error: z.ZodError): CreateOfferResult {
  const fieldErrors: CreateOfferResult["fieldErrors"] = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (
      typeof field === "string" &&
      OFFER_FIELDS.has(field as keyof OfferInput)
    ) {
      fieldErrors[field as keyof OfferInput] ??= issue.message;
    }
  }
  return { ok: false, fieldErrors };
}
