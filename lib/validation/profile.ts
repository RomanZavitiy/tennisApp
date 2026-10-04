import { z } from "zod";

import { District, Gender } from "@/lib/generated/prisma/enums";
import { NTRP_LEVELS } from "@/lib/profile/options";

// The player profile: one schema for the onboarding/edit form and for the
// server action that saves it (the action re-checks, since a request can skip
// the form). The database CHECKs from task 1.10 back up the same rules.

export const MIN_AGE = 16;

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

export const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter your name.")
    .max(50, "Keep your name under 50 characters."),
  // A YYYY-MM-DD string, as <input type="date"> gives it.
  birthDate: z.iso
    .date("Enter your date of birth.")
    .refine((date) => date <= todayInKrakow(), "That date is in the future.")
    // A future date already has its own message; don't add a second one.
    .refine(
      (date) =>
        date > todayInKrakow() || ageOn(date, todayInKrakow()) >= MIN_AGE,
      `You must be at least ${String(MIN_AGE)} to join.`,
    ),
  gender: z.enum(Gender, "Choose your gender."),
  district: z.enum(District, "Choose your district."),
  // One check against the list the form offers, so a bad value gets one
  // message rather than one per broken rule (range, step).
  selfRatedNtrp: z
    .number("Choose your level.")
    .refine((level) => NTRP_LEVELS.includes(level), "Choose your level."),
});

export type ProfileInput = z.input<typeof profileSchema>;
export type ProfileValues = z.output<typeof profileSchema>;
