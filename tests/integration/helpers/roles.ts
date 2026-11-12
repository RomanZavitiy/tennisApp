import { db } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";

// The app itself connects as the tables' owner, which RLS doesn't apply to.
// The browser doesn't: Supabase's Data API and Realtime run each request as
// the "anon" or "authenticated" role, with the session's JWT claims in
// `request.jwt.claims` -- which is what auth.uid() in the policies reads.
// This does the same for one transaction; the role ends with it.

export type ApiCaller =
  { role: "anon" } | { role: "authenticated"; sub: string };

/** Runs `query` the way the Data API would: as `anon`, or as `authenticated` with this user's JWT. */
export function asApiRole<T>(
  who: ApiCaller,
  query: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  const claims = JSON.stringify(
    who.role === "anon" ? { role: "anon" } : { role: who.role, sub: who.sub },
  );
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT set_config('request.jwt.claims', ${claims}, true)`;
    // A role name can't be a bind parameter; it is one of two literals.
    await tx.$executeRawUnsafe(
      who.role === "anon"
        ? "SET LOCAL ROLE anon"
        : "SET LOCAL ROLE authenticated",
    );
    return query(tx);
  });
}
