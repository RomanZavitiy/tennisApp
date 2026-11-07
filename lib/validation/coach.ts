import { z } from "zod";

import { CoachLevel, District, Locale } from "@/lib/generated/prisma/enums";
import { todayInKrakow } from "@/lib/validation/profile";

// One coach record in prisma/data/coaches.json. The loader
// (prisma/load-coaches.ts) checks the whole file with this before writing
// anything — the same shape and strictness as lib/validation/club.ts. Club
// slugs are checked for format here; whether they actually exist is checked
// by the loader (lib/coaches/upsert-coaches.ts), which has the database
// connection this schema doesn't.

const httpUrl = z.url({ protocol: /^https?$/ });

const SLUG_FORMAT = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// Strict, so a misspelt key ("phnoe") fails instead of quietly dropping data.
export const coachSchema = z.strictObject({
  slug: z
    .string()
    .max(60)
    .regex(SLUG_FORMAT, "Use lowercase words joined by hyphens."),
  name: z.string().trim().min(1).max(100),
  bio: z.string().trim().min(1).max(600).nullable(),
  district: z.enum(District).nullable(),
  // At least one, no repeats — a coach with no declared level can't be
  // found by the directory's filters (task P.9).
  levels: z
    .array(z.enum(CoachLevel))
    .min(1)
    .refine(
      (levels) => new Set(levels).size === levels.length,
      "List each level once.",
    ),
  languages: z
    .array(z.enum(Locale))
    .min(1)
    .refine(
      (languages) => new Set(languages).size === languages.length,
      "List each language once.",
    ),
  priceInfo: z.string().trim().min(1).max(300).nullable(),
  phone: z.string().trim().min(1).max(30).nullable(),
  websiteUrl: httpUrl.max(500).nullable(),
  verifiedAt: z.iso
    .date()
    .refine((date) => date <= todayInKrakow(), "That date is in the future."),
  // Where this coach teaches — by slug, same stable key clubs.json uses.
  // The loader rejects a slug that doesn't match any loaded club.
  clubSlugs: z
    .array(z.string().max(60).regex(SLUG_FORMAT, "Not a valid club slug."))
    .min(1)
    .refine(
      (slugs) => new Set(slugs).size === slugs.length,
      "List each club once.",
    ),
  // Where the details come from, same reasoning as Club's own `source`.
  source: httpUrl,
});

export type CoachRecord = z.output<typeof coachSchema>;

/**
 * Checks every record in the data file and returns them all, or throws one
 * error listing each bad record by name, so a broken file is fixed in one go.
 */
export function parseCoachFile(data: unknown): CoachRecord[] {
  const records = z.array(z.unknown()).parse(data);
  const coaches: CoachRecord[] = [];
  const problems: string[] = [];
  const seenSlugs = new Set<string>();

  records.forEach((record, index) => {
    const result = coachSchema.safeParse(record);
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
    coaches.push(result.data);
  });

  if (problems.length > 0) {
    throw new Error(`Invalid coach data:\n${problems.join("\n")}`);
  }
  return coaches;
}

// The coach's name if the record has one, else its position in the file.
function describe(record: unknown, index: number): string {
  const name =
    typeof record === "object" && record !== null && "name" in record
      ? record.name
      : undefined;
  return typeof name === "string" && name.trim() !== ""
    ? `Coach "${name}"`
    : `Coach #${String(index + 1)}`;
}
