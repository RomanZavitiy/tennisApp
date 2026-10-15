import { z } from "zod";

import { District, Gender } from "@/lib/generated/prisma/enums";
import { NTRP_LEVELS } from "@/lib/profile/options";

// The player profile: one schema for the onboarding/edit form and for the
// server action that saves it (the action re-checks, since a request can skip
// the form). The database CHECKs from task 1.10 back up the same rules.

// Raised from 16 to 18 on 2026-10-14: the app puts strangers in touch
// offline, and 18+ removes the risk of connecting an adult with a minor.
export const MIN_AGE = 18;

// Birthdays turn over at midnight in Kraków, not in UTC or wherever the
// server happens to run: "today" is the calendar date in Europe/Warsaw.
export function todayInKrakow(now = new Date()): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Warsaw",
  }).format(now);
}

/**
 * Full years between two calendar dates given as YYYY-MM-DD. Compares
 * month-day strings instead of using Date math, so there are no time zone or
 * daylight-saving surprises. Someone born on 29 February gets a year older on
 * 1 March in non-leap years — the later, stricter reading.
 */
export function ageOn(birthDate: string, today: string): number {
  const years = Number(today.slice(0, 4)) - Number(birthDate.slice(0, 4));
  const birthdayPassed = today.slice(5) >= birthDate.slice(5);
  return birthdayPassed ? years : years - 1;
}

type ValidationT = (key: string, values?: Record<string, number>) => string;

/** `t` is a translator for the "Validation.profile" namespace (task 1.20). */
export function profileSchema(t: ValidationT) {
  return z.object({
    name: z.string().trim().min(1, t("nameRequired")).max(50, t("nameTooLong")),
    // A YYYY-MM-DD string, as <input type="date"> gives it.
    birthDate: z.iso
      .date(t("birthDateRequired"))
      .refine((date) => date <= todayInKrakow(), t("futureDate"))
      // A future date already has its own message; don't add a second one.
      .refine(
        (date) =>
          date > todayInKrakow() || ageOn(date, todayInKrakow()) >= MIN_AGE,
        t("tooYoung", { min: MIN_AGE }),
      ),
    gender: z.enum(Gender, t("genderRequired")),
    district: z.enum(District, t("districtRequired")),
    // One check against the list the form offers, so a bad value gets one
    // message rather than one per broken rule (range, step).
    selfRatedNtrp: z
      .number(t("levelRequired"))
      .refine((level) => NTRP_LEVELS.includes(level), t("levelRequired")),
  });
}

export type ProfileInput = z.input<ReturnType<typeof profileSchema>>;
export type ProfileValues = z.output<ReturnType<typeof profileSchema>>;

// What a profile-saving server action returns when it doesn't redirect: the
// first message per field, for the form to show next to it.
export type SaveProfileResult = {
  ok: false;
  fieldErrors: Partial<Record<keyof ProfileInput, string>>;
};

// The schema is now a function (it needs a translator — task 1.20), so this
// can't read `.shape` off it any more; the field set is static anyway.
const PROFILE_FIELDS = new Set<keyof ProfileInput>([
  "name",
  "birthDate",
  "gender",
  "district",
  "selfRatedNtrp",
]);

export function profileFieldErrors(error: z.ZodError): SaveProfileResult {
  const fieldErrors: SaveProfileResult["fieldErrors"] = {};
  for (const issue of error.issues) {
    // A request that isn't an object at all has no field to attach to; the
    // form never sends one, so it only gets `ok: false`.
    const field = issue.path[0];
    if (
      typeof field === "string" &&
      PROFILE_FIELDS.has(field as keyof ProfileInput)
    ) {
      fieldErrors[field as keyof ProfileInput] ??= issue.message;
    }
  }
  return { ok: false, fieldErrors };
}

/** Validated profile values in the shape the `users` table stores them. */
export function profileToUserData({ birthDate, ...profile }: ProfileValues) {
  return {
    ...profile,
    // A date column: midnight UTC of that calendar day stores exactly it.
    birthDate: new Date(`${birthDate}T00:00:00Z`),
  };
}
