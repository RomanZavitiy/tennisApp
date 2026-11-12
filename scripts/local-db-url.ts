// The one guard between test tooling and the shared Supabase database
// (.env.local points DATABASE_URL / DIRECT_URL at it). Everything that
// creates, migrates or wipes a database for tests -- scripts/test-db.ts,
// tests/integration, prisma.config.ts's shadow database -- takes its URL
// through here, and refuses anything that isn't on this machine.

/**
 * Where `docker run ... -p 127.0.0.1:54329:5432 postgres:17` from the README
 * listens. Used when TEST_DATABASE_URL isn't set, so the local commands work
 * without touching .env.local; CI sets the variable to its service container.
 */
export const DEFAULT_TEST_DATABASE_URL =
  "postgresql://postgres:postgres@127.0.0.1:54329/spinbuddy_test";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

export function isLocalDatabaseUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      (parsed.protocol === "postgresql:" || parsed.protocol === "postgres:") &&
      LOCAL_HOSTS.has(parsed.hostname)
    );
  } catch {
    return false;
  }
}

/** The URL from `variable`, or an error naming it -- never the host itself, which may carry a password. */
export function requireLocalDatabaseUrl(
  variable: string,
  value: string | undefined = process.env[variable],
): string {
  if (!value) {
    throw new Error(
      `${variable} is not set. Point it at a local Postgres, e.g. ` +
        "postgresql://postgres:postgres@127.0.0.1:54329/spinbuddy_test (see README, “Integration tests”).",
    );
  }
  if (!isLocalDatabaseUrl(value)) {
    throw new Error(
      `${variable} must point at localhost / 127.0.0.1. Refusing to touch a remote database.`,
    );
  }
  return value;
}

/** TEST_DATABASE_URL (or the local default), checked to be on this machine. */
export function testDatabaseUrl(): string {
  return requireLocalDatabaseUrl(
    "TEST_DATABASE_URL",
    process.env.TEST_DATABASE_URL || DEFAULT_TEST_DATABASE_URL,
  );
}
