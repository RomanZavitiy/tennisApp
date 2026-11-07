import { z } from "zod";

import { District, OfferFormat } from "@/lib/generated/prisma/enums";
import { TIMES_OF_DAY } from "@/lib/offers/feed-filters";
import { zodFieldErrors } from "@/lib/validation/field-errors";
import { todayInKrakow } from "@/lib/validation/profile";

// "Хочу зіграти" (slice U2, task U2.1): one schema for the form and for
// postPlayIntent(), which re-checks, since a request can skip the form.
// Only `note` is optional — date, times and districts all need at least
// one value, or the card posted would have nothing to match against.

export const NOTE_MAX = 200;

type ValidationT = (key: string, values?: Record<string, number>) => string;

const emptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

/** `t` is a translator for the "Validation.playIntent" namespace (task 1.20). */
export function playIntentSchema(t: ValidationT) {
  return z.object({
    date: z.iso
      .date(t("dateRequired"))
      .refine((date) => date >= todayInKrakow(), t("datePast")),
    times: z.enum(TIMES_OF_DAY).array().min(1, t("timesRequired")),
    districts: z.enum(District).array().min(1, t("districtsRequired")),
    format: z.enum(OfferFormat).default("SINGLES"),
    note: z.preprocess(
      emptyToUndefined,
      z
        .string()
        .trim()
        .max(NOTE_MAX, t("noteTooLong", { max: NOTE_MAX }))
        .optional(),
    ),
  });
}

export type PlayIntentInput = z.input<ReturnType<typeof playIntentSchema>>;
export type PlayIntentValues = z.output<ReturnType<typeof playIntentSchema>>;

export type PostPlayIntentResult =
  | { ok: true }
  | {
      ok: false;
      fieldErrors: Partial<Record<keyof PlayIntentInput, string>>;
      message?: string;
    };

const PLAY_INTENT_FIELDS: (keyof PlayIntentInput)[] = [
  "date",
  "times",
  "districts",
  "format",
  "note",
];

export function playIntentFieldErrors(error: z.ZodError): PostPlayIntentResult {
  return { ok: false, fieldErrors: zodFieldErrors(error, PLAY_INTENT_FIELDS) };
}
