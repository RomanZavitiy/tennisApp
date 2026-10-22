/**
 * A Postgres exclusion-violation (23P01) from one of the two EXCLUDE
 * constraints on `bookings` and `court_blocks` (K.2) — two writes for the
 * same court/time raced past whatever check ran first in application code.
 * Checked defensively across the shapes Prisma 7 (no Rust engine) is seen
 * to wrap a driver error in, since this constraint isn't one Prisma's
 * schema can express as a typed error code. Shared by app/clubs/[id]/book/
 * actions.ts (K.10, a booking vs. another booking) and app/(club)/club/
 * [clubId]/actions.ts (K.17, a block vs. another block).
 */
export function isExclusionViolation(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const direct = (error as { code?: unknown }).code;
  if (direct === "23P01") return true;
  const meta = (error as { meta?: { code?: unknown } }).meta;
  if (meta?.code === "23P01") return true;
  const cause = (error as { cause?: unknown }).cause;
  return (
    typeof cause === "object" &&
    cause !== null &&
    (cause as { code?: unknown }).code === "23P01"
  );
}
