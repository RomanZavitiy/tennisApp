const EXCLUSION_VIOLATION = "23P01";

function codeOf(value: unknown): unknown {
  return typeof value === "object" && value !== null
    ? (value as { code?: unknown }).code
    : undefined;
}

/**
 * A Postgres exclusion-violation (23P01) from one of the two EXCLUDE
 * constraints on `bookings` and `court_blocks` (K.2) — two writes for the
 * same court/time raced past whatever check ran first in application code.
 * This constraint isn't one Prisma's schema can express as a typed error
 * code, so the SQLSTATE has to be dug out of whatever wraps it.
 *
 * What Prisma 7 with the pg driver adapter actually throws (seen against a
 * real Postgres, tests/integration/booking.test.ts) is a
 * PrismaClientKnownRequestError — P2039 from a model call, P2010 from a raw
 * query — with the driver's error at `meta.driverAdapterError.cause`. The
 * three flatter shapes are kept from before that was known: cheap, and
 * right for an error thrown by the driver itself.
 *
 * Shared by app/clubs/[id]/book/actions.ts (K.10, a booking vs. another
 * booking) and app/(club)/club/[clubId]/actions.ts (K.17, a block vs.
 * another block).
 */
export function isExclusionViolation(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const { meta, cause } = error as {
    meta?: { driverAdapterError?: { cause?: unknown } };
    cause?: unknown;
  };
  return [
    codeOf(error),
    codeOf(meta),
    codeOf(cause),
    codeOf(meta?.driverAdapterError?.cause),
  ].includes(EXCLUSION_VIOLATION);
}
