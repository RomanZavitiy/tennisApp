import { z } from "zod";

import { District, IndoorCourts, Surface } from "@/lib/generated/prisma/enums";
import { todayInKrakow } from "@/lib/validation/profile";

// One club record in prisma/data/clubs.json. The loader (prisma/load-clubs.ts)
// checks the whole file with this before writing anything. The CHECKs from
// task 2.1 repeat the basic rules in the database; the rules only Zod has are
// coordinates inside Kraków and no repeated surface.

/** A box around the city limits, with a little margin. */
export const KRAKOW_BOUNDS = {
  minLatitude: 49.95,
  maxLatitude: 50.14,
  minLongitude: 19.78,
  maxLongitude: 20.23,
};

const httpUrl = z.url({ protocol: /^https?$/ });

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
  district: z.enum(District),
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
    .min(1)
    .refine(
      (surfaces) => new Set(surfaces).size === surfaces.length,
      "List each surface once.",
    ),
  indoor: z.enum(IndoorCourts),
  priceInfo: z.string().trim().min(1).max(300).nullable(),
  phone: z.string().trim().min(1).max(30).nullable(),
  websiteUrl: httpUrl.max(500).nullable(),
  bookingUrl: httpUrl.max(500).nullable(),
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
