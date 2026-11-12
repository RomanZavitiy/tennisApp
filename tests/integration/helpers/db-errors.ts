import { expect } from "vitest";

// What Postgres said about a rejected write. Prisma 7 with a driver adapter
// has no typed error for CHECK / EXCLUDE violations or RLS denials, and
// wraps the driver's error differently by call (model method, raw query,
// inside a transaction) -- so this walks the whole error, the same defensive
// way lib/booking/db-errors.ts does for the one code the app handles.

function collect(error: unknown, seen: Set<unknown>, out: string[]): void {
  if (error === null || error === undefined || seen.has(error)) {
    return;
  }
  if (typeof error === "string") {
    out.push(error);
    return;
  }
  if (typeof error !== "object") {
    return;
  }
  seen.add(error);
  if (error instanceof Error) {
    out.push(error.message);
  }
  for (const value of Object.values(error)) {
    collect(value, seen, out);
  }
  collect((error as { cause?: unknown }).cause, seen, out);
}

/** Every message, code and constraint name found anywhere in `error`. */
export function dbErrorText(error: unknown): string {
  const out: string[] = [];
  collect(error, new Set(), out);
  return out.join("\n");
}

/** Postgres error classes the tests care about. */
export const PG = {
  checkViolation: "23514",
  exclusionViolation: "23P01",
  foreignKeyViolation: "23503",
  insufficientPrivilege: "42501",
} as const;

/**
 * Expects `write` to be refused by Postgres with this SQLSTATE and, when
 * given, this constraint -- so a test can't pass on the wrong failure.
 */
export async function expectDbRejection(
  write: Promise<unknown>,
  expected: { code: string; mentions?: string },
): Promise<void> {
  let caught: unknown;
  try {
    await write;
  } catch (error) {
    caught = error;
  }
  expect(caught, "the write should have been rejected").toBeDefined();
  const text = dbErrorText(caught);
  expect(text).toContain(expected.code);
  if (expected.mentions) {
    expect(text).toContain(expected.mentions);
  }
}
