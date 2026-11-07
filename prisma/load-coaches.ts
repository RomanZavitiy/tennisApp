import { existsSync, readFileSync } from "node:fs";

// Loads prisma/data/coaches.json into the database. Run with `pnpm
// coaches:load`. Safe to run again: coaches are matched by slug, so a
// second run updates changed fields instead of adding copies. Nothing is
// written unless every record passes the coach schema and every club it
// names by slug already exists (clubs load first — see AGENTS.md's
// "already shipped" pipeline this mirrors).
//
// One coach record:
// {
//   "slug": "jan-kowalski",            // lowercase words, joined by hyphens
//   "name": "Jan Kowalski",
//   "bio": "...",                      // or null
//   "district": "STARE_MIASTO",        // or null — see lib/generated/prisma/enums District
//   "levels": ["BEGINNER", "KIDS"],    // at least one — BEGINNER | INTERMEDIATE | ADVANCED | KIDS
//   "languages": ["PL", "EN"],         // at least one — PL | EN
//   "priceInfo": "150 zł/h",           // or null
//   "phone": "+48 600 000 000",        // or null
//   "websiteUrl": "https://example.com/", // or null
//   "verifiedAt": "2026-11-07",        // YYYY-MM-DD, not in the future
//   "clubSlugs": ["kks-olsza"],        // at least one, each an existing club's slug
//   "source": "https://example.com/about" // where these details come from
// }

async function main() {
  // Same as prisma.config.ts: Node's built-in env loader. lib/db reads the
  // env as soon as it loads, so it is imported only after this.
  if (existsSync(".env.local")) {
    process.loadEnvFile(".env.local");
  }
  const { db } = await import("@/lib/db");
  const { upsertCoaches } = await import("@/lib/coaches/upsert-coaches");
  const { parseCoachFile } = await import("@/lib/validation/coach");

  const coaches = parseCoachFile(
    JSON.parse(readFileSync("prisma/data/coaches.json", "utf8")),
  );

  try {
    // One transaction: a failed write leaves the coaches as they were.
    await db.$transaction((tx) => upsertCoaches(tx, coaches), {
      timeout: 30_000,
    });
    process.stdout.write(`Loaded ${String(coaches.length)} coaches.\n`);
  } finally {
    await db.$disconnect();
  }
}

void main();
