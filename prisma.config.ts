import { existsSync } from "node:fs";
import { defineConfig } from "prisma/config";

// Prisma 7 doesn't read env files itself. Real values live in .env.local
// (the file Next.js reads), so load it here with Node's built-in loader
// instead of adding dotenv. The file is absent in CI, where the env comes
// from the environment.
if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    // Plain SQL, so the seed needs no TypeScript runner (see prisma/seed.sql).
    seed: "prisma db execute --file prisma/seed.sql",
  },
  // The CLI (migrate, db pull, studio) uses the direct connection: migrations
  // can't run through the transaction pooler. The app itself connects via
  // DATABASE_URL in lib/db.ts.
  datasource: {
    url: process.env.DIRECT_URL,
  },
});
