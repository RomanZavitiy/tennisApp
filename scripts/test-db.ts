import { spawnSync } from "node:child_process";

import { testDatabaseUrl } from "./local-db-url";

// The local/CI test database, start to finish (see README, "Integration
// tests"). Every command reads TEST_DATABASE_URL (default: the local container from
// the README), refuses a host that isn't
// this machine, and only then hands that URL to the Prisma CLI -- .env.local's
// DIRECT_URL (the shared Supabase database) is never used here.
//
//   setup [--reset]   bootstrap (prisma/bootstrap/supabase-shim.sql), then
//                     every migration. --reset wipes the database first.
//   check             fails (exit 2) if the migrated database and
//                     prisma/schema.prisma disagree.
//   migrate-dev ...   `prisma migrate dev` against the test database, with
//                     shadow databases that can replay the history.

const PRISMA_CLI = "node_modules/prisma/build/index.js";
const BOOTSTRAP_FILE = "prisma/bootstrap/supabase-shim.sql";

const RESET_SQL = `
DROP SCHEMA IF EXISTS public CASCADE;
DROP SCHEMA IF EXISTS private CASCADE;
DROP SCHEMA IF EXISTS storage CASCADE;
DROP SCHEMA IF EXISTS auth CASCADE;
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE SCHEMA public;
`;

function prisma(
  args: string[],
  databaseUrl: string,
  options: { input?: string } = {},
): number {
  // The CLI's own entry point under this Node, not the `prisma` shim: that is
  // a .cmd file on Windows and would need a shell to run.
  const result = spawnSync(process.execPath, [PRISMA_CLI, ...args], {
    input: options.input,
    stdio: [
      options.input === undefined ? "inherit" : "pipe",
      "inherit",
      "inherit",
    ],
    env: {
      ...process.env,
      // prisma.config.ts re-checks the URL when this is set.
      PRISMA_LOCAL_ONLY: "1",
      DIRECT_URL: databaseUrl,
      DATABASE_URL: databaseUrl,
    },
  });
  return result.status ?? 1;
}

function run(...call: Parameters<typeof prisma>): void {
  const status = prisma(...call);
  if (status !== 0) {
    process.exit(status);
  }
}

function setup(databaseUrl: string, reset: boolean): void {
  if (reset) {
    run(["db", "execute", "--stdin"], databaseUrl, { input: RESET_SQL });
  }
  run(["db", "execute", "--file", BOOTSTRAP_FILE], databaseUrl);
  run(["migrate", "deploy"], databaseUrl);
}

function check(databaseUrl: string): void {
  const status = prisma(
    [
      "migrate",
      "diff",
      "--from-config-datasource",
      "--to-schema",
      "prisma/schema.prisma",
      "--exit-code",
    ],
    databaseUrl,
  );
  if (status === 2) {
    console.error(
      "\nprisma/schema.prisma and the SQL in prisma/migrations disagree (diff above: " +
        "what it would take to turn the migrated database into the schema). " +
        "Fix whichever side is wrong -- with a new migration, never by editing an applied one.",
    );
  }
  process.exit(status);
}

// `migrate dev` replays the whole history on a shadow database that Prisma
// creates (and drops) on the same server, several times per run. Each is a
// copy of template1, so the bootstrap goes there: every shadow database is
// then born with the auth schema, roles and publication the migrations
// need. (A fixed, pre-made shadow database doesn't work: Prisma resets only
// "public" in it, so "private" functions and storage policies from one
// replay collide with the next.)
function migrateDev(databaseUrl: string, args: string[]): void {
  const template = new URL(databaseUrl);
  template.pathname = "/template1";
  run(["db", "execute", "--file", BOOTSTRAP_FILE], template.toString());
  process.exit(prisma(["migrate", "dev", ...args], databaseUrl));
}

const [command, ...rest] = process.argv.slice(2);
const databaseUrl = testDatabaseUrl();

switch (command) {
  case "setup":
    setup(databaseUrl, rest.includes("--reset"));
    break;
  case "check":
    check(databaseUrl);
    break;
  case "migrate-dev":
    migrateDev(databaseUrl, rest);
    break;
  default:
    console.error(
      "Usage: tsx scripts/test-db.ts <setup [--reset] | check | migrate-dev [prisma args]>",
    );
    process.exit(1);
}
