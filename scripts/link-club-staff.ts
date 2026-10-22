import { existsSync } from "node:fs";

// Thin CLI wrapper around lib/clubs/link-staff.ts (K.19) — owner-run, no
// self-serve staff onboarding. Run with:
//   pnpm staff:link <email> <club-slug> <OWNER|STAFF>

function usageError(message: string): never {
  process.stderr.write(
    `${message}\nUsage: pnpm staff:link <email> <club-slug> <OWNER|STAFF>\n`,
  );
  process.exit(1);
}

async function main() {
  if (existsSync(".env.local")) {
    process.loadEnvFile(".env.local");
  }
  const [email, clubSlug, roleArg] = process.argv.slice(2);
  if (!email || !clubSlug || !roleArg) {
    usageError("Missing arguments.");
  }
  const role = roleArg.toUpperCase();
  if (role !== "OWNER" && role !== "STAFF") {
    usageError(`Role must be OWNER or STAFF, got "${roleArg}".`);
  }

  const { db } = await import("@/lib/db");
  const { linkClubStaff } = await import("@/lib/clubs/link-staff");
  try {
    const result = await linkClubStaff(email, clubSlug, role);
    if (!result.ok) {
      usageError(result.message);
    }
    process.stdout.write(`Linked ${email} to ${clubSlug} as ${role}.\n`);
  } finally {
    await db.$disconnect();
  }
}

void main();
