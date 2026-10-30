import { z } from "zod";

import { District } from "@/lib/generated/prisma/enums";

// A player's tip about a club not on the platform yet (slice M, task M.1):
// one schema for the form and for submitClub() (M.4), which re-checks,
// since a request can skip the form.

export const NAME_MAX = 100;
export const ADDRESS_MAX = 200;
export const NOTES_MAX = 500;

type ValidationT = (key: string, values?: Record<string, number>) => string;

// A form sends "" for an untouched select or an empty textarea; treat it as
// "not given", the same as a missing field.
const emptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

/** `t` is a translator for the "Validation.clubSubmission" namespace (task 1.20). */
export function clubSubmissionSchema(t: ValidationT) {
  return z.object({
    name: z.preprocess(
      emptyToUndefined,
      z
        .string(t("nameRequired"))
        .trim()
        .max(NAME_MAX, t("nameTooLong", { max: NAME_MAX })),
    ),
    address: z.preprocess(
      emptyToUndefined,
      z
        .string(t("addressRequired"))
        .trim()
        .max(ADDRESS_MAX, t("addressTooLong", { max: ADDRESS_MAX })),
    ),
    districtGuess: z.preprocess(
      emptyToUndefined,
      z.enum(District, t("districtInvalid")).optional(),
    ),
    notes: z.preprocess(
      emptyToUndefined,
      z
        .string()
        .trim()
        .max(NOTES_MAX, t("notesTooLong", { max: NOTES_MAX }))
        .optional(),
    ),
  });
}

export type ClubSubmissionInput = z.input<
  ReturnType<typeof clubSubmissionSchema>
>;
export type ClubSubmissionValues = z.output<
  ReturnType<typeof clubSubmissionSchema>
>;

// What submitClub() returns when it doesn't succeed: the first message per
// field, for the form to show next to it (same shape as the offer form's).
// `message` is for a refusal that isn't about any one field — blocked
// (6.4) or the daily rate limit (M.3).
export type SubmitClubResult =
  | { ok: true }
  | {
      ok: false;
      fieldErrors: Partial<Record<keyof ClubSubmissionInput, string>>;
      message?: string;
    };

const CLUB_SUBMISSION_FIELDS = new Set<keyof ClubSubmissionInput>([
  "name",
  "address",
  "districtGuess",
  "notes",
]);

export function clubSubmissionFieldErrors(error: z.ZodError): SubmitClubResult {
  const fieldErrors: Extract<SubmitClubResult, { ok: false }>["fieldErrors"] =
    {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (
      typeof field === "string" &&
      CLUB_SUBMISSION_FIELDS.has(field as keyof ClubSubmissionInput)
    ) {
      fieldErrors[field as keyof ClubSubmissionInput] ??= issue.message;
    }
  }
  return { ok: false, fieldErrors };
}
