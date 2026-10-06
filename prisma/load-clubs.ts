import { existsSync, readFileSync } from "node:fs";

// Loads prisma/data/clubs.json into the database. Run with `pnpm clubs:load`.
// Safe to run again: clubs are matched by slug, so a second run updates
// changed fields instead of adding copies. Nothing is written unless every
// record passes the club schema.

async function main() {
  // Same as prisma.config.ts: Node's built-in env loader. lib/db reads the env
  // as soon as it loads, so it is imported only after this.
  if (existsSync(".env.local")) {
    process.loadEnvFile(".env.local");
  }
  const { db } = await import("@/lib/db");
  const { upsertClubs } = await import("@/lib/clubs/upsert-clubs");
  const { parseClubFile } = await import("@/lib/validation/club");

  const clubs = parseClubFile(
    JSON.parse(readFileSync("prisma/data/clubs.json", "utf8")),
  );

  try {
    // One transaction: a failed write leaves the clubs as they were.
    await db.$transaction((tx) => upsertClubs(tx, clubs), { timeout: 30_000 });
    process.stdout.write(`Loaded ${String(clubs.length)} clubs.\n`);
  } finally {
    await db.$disconnect();
  }
}

void main();
