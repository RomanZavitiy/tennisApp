import { z } from "zod";

import {
  BookingMode,
  District,
  IndoorCourts,
  Surface,
} from "@/lib/generated/prisma/enums";
import { todayInKrakow } from "@/lib/validation/profile";

// One club record in prisma/data/clubs.json. The loader (prisma/load-clubs.ts)
// checks the whole file with this before writing anything. The CHECKs from
// task 2.1 repeat the basic rules in the database; the rules only Zod has are
// coordinates inside Kraków and no repeated surface. A null district, a null
// indoor and an empty surfaces list mean "unknown" or "outside the city"
// (2.11); the pages leave them out.

/** A box around the city limits, with a little margin. */
export const KRAKOW_BOUNDS = {
  minLatitude: 49.95,
  maxLatitude: 50.14,
  minLongitude: 19.78,
  maxLongitude: 20.23,
};

const httpUrl = z.url({ protocol: /^https?$/ });

const TIME_HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** "08:00" → 480, matching CourtHours' opensAt/closesAt (minutes from midnight). */
export function minutesFromHHMM(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

// One court a SPINBUDDY club declares (K.6). `pricePerHourPln` omitted or
// null both mean "unknown" — never invented, same convention as the club's
// own `priceInfo`.
export const courtRecordSchema = z.strictObject({
  name: z.string().trim().min(1).max(60),
  surface: z.enum(Surface),
  indoor: z.boolean(),
  pricePerHourPln: z.int().positive().nullable().optional(),
});
export type CourtRecord = z.output<typeof courtRecordSchema>;

// One weekday's opening hours for a SPINBUDDY club (K.6), mirroring
// CourtHours. Kept as "HH:MM" strings here — the file's own shape; the
// loader converts to opensAt/closesAt minutes.
export const courtHoursRecordSchema = z
  .strictObject({
    weekday: z.int().min(0).max(6),
    opens: z.string().regex(TIME_HHMM, "Use HH:MM."),
    closes: z.string().regex(TIME_HHMM, "Use HH:MM."),
  })
  .refine(
    (hours) => minutesFromHHMM(hours.opens) < minutesFromHHMM(hours.closes),
    { message: "opens must be before closes.", path: ["closes"] },
  );
export type CourtHoursRecord = z.output<typeof courtHoursRecordSchema>;

// Strict, so a misspelt key ("phnoe") fails instead of quietly dropping data.
export const clubSchema = z.strictObject({
  slug: z
    .string()
    .max(60)
    .regex(
      /^[a-z0-9]+(-[a-z0-9]+)*$/,
      "Use lowercase words joined by hyphens.",
    ),
  name: z.string().trim().min(1).max(100),
  address: z.string().trim().min(1).max(200),
  district: z.enum(District).nullable(),
  latitude: z
    .number()
    .min(KRAKOW_BOUNDS.minLatitude, "Not in Kraków.")
    .max(KRAKOW_BOUNDS.maxLatitude, "Not in Kraków."),
  longitude: z
    .number()
    .min(KRAKOW_BOUNDS.minLongitude, "Not in Kraków.")
    .max(KRAKOW_BOUNDS.maxLongitude, "Not in Kraków."),
  courtCount: z.int().min(1),
  surfaces: z
    .array(z.enum(Surface))
    .refine(
      (surfaces) => new Set(surfaces).size === surfaces.length,
      "List each surface once.",
    ),
  indoor: z.enum(IndoorCourts).nullable(),
  priceInfo: z.string().trim().min(1).max(300).nullable(),
  phone: z.string().trim().min(1).max(30).nullable(),
  websiteUrl: httpUrl.max(500).nullable(),
  bookingUrl: httpUrl.max(500).nullable(),
  // Slice K (decision 2026-10-21): a club may switch itself into
  // SpinBuddy-run booking here and declare its courts/hours. All three are
  // optional so every club already in the file keeps validating as-is;
  // omitted means EXTERNAL_LINK with no courts yet, the same as the Club
  // table's own defaults.
  bookingMode: z.enum(BookingMode).optional().default("EXTERNAL_LINK"),
  courts: z
    .array(courtRecordSchema)
    .optional()
    .default([])
    .refine(
      (courts) => new Set(courts.map((c) => c.name)).size === courts.length,
      "List each court name once.",
    ),
  hours: z
    .array(courtHoursRecordSchema)
    .optional()
    .default([])
    .refine(
      (hours) => new Set(hours.map((h) => h.weekday)).size === hours.length,
      "List each weekday once.",
    ),
  verifiedAt: z.iso
    .date()
    .refine((date) => date <= todayInKrakow(), "That date is in the future."),
  // Where the details come from (DoD 2.2). Kept in the file, not the database.
  source: httpUrl,
  // Fields still holding stand-in values (see the 2.2a data). File-only too.
  todo: z.array(z.string()).optional(),
});

export type ClubRecord = z.output<typeof clubSchema>;

/**
 * Checks every record in the data file and returns them all, or throws one
 * error listing each bad record by name, so a broken file is fixed in one go.
 */
export function parseClubFile(data: unknown): ClubRecord[] {
  const records = z.array(z.unknown()).parse(data);
  const clubs: ClubRecord[] = [];
  const problems: string[] = [];
  const seenSlugs = new Set<string>();

  records.forEach((record, index) => {
    const result = clubSchema.safeParse(record);
    if (!result.success) {
      const issues = result.error.issues.map(
        (issue) => `${issue.path.join(".") || "(record)"}: ${issue.message}`,
      );
      problems.push(`${describe(record, index)} — ${issues.join("; ")}`);
      return;
    }
    if (seenSlugs.has(result.data.slug)) {
      problems.push(
        `${describe(record, index)} — slug: "${result.data.slug}" is used twice.`,
      );
      return;
    }
    seenSlugs.add(result.data.slug);
    clubs.push(result.data);
  });

  if (problems.length > 0) {
    throw new Error(`Invalid club data:\n${problems.join("\n")}`);
  }
  return clubs;
}

// The club's name if the record has one, else its position in the file.
function describe(record: unknown, index: number): string {
  const name =
    typeof record === "object" && record !== null && "name" in record
      ? record.name
      : undefined;
  return typeof name === "string" && name.trim() !== ""
    ? `Club "${name}"`
    : `Club #${String(index + 1)}`;
}
