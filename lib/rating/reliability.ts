import type { Prisma } from "@/lib/generated/prisma/client";
import type { MatchParty } from "@/lib/generated/prisma/enums";

// Reliability (decision 2026-10-14, "Надійність гравця"): a percentage of a
// player's scheduled singles matches that had neither a no-show nor a late
// cancellation from them, shown only once they have at least 3 scheduled
// matches — before that, "New player". The three counts it's built from are
// fields on User (schema, task 4.10-4.12), not a query: offer_joins only
// keeps a join's *current* status, so there's no way to ask "was this join
// ever ACCEPTED" once it's withdrawn, and no history table records a late
// cancellation at all.

const LATE_CANCELLATION_WINDOW_MS = 12 * 60 * 60 * 1000;

/** A cancellation less than 12h before the start (decision 2026-10-14). */
export function isLateCancellation(startsAt: Date, now: Date): boolean {
  return startsAt.getTime() - now.getTime() < LATE_CANCELLATION_WINDOW_MS;
}

/**
 * The author cancels an offer with accepted players less than 12h out
 * (3.14), or a player withdraws an already-accepted join that late (3.12).
 */
export async function recordLateCancellation(
  tx: Prisma.TransactionClient,
  userId: string,
): Promise<void> {
  await tx.user.update({
    where: { id: userId },
    data: { lateCancellations: { increment: 1 } },
  });
}

/**
 * A singles join reaching ACCEPTED (3.12): counts as scheduled for both
 * sides, whatever happens to it afterwards.
 */
export async function recordScheduledMatch(
  tx: Prisma.TransactionClient,
  userIds: readonly [authorId: string, playerId: string],
): Promise<void> {
  await tx.user.updateMany({
    where: { id: { in: [...userIds] } },
    data: { scheduledMatches: { increment: 1 } },
  });
}

/**
 * Settles a no-show report (4.10) that nobody disputed within 72h — the
 * cron's job, same moment a scored result would be auto-confirmed
 * (applyMatchEloFromJoin), but this one moves no ELO: only the reported
 * player's noShows counter, and the result's own status.
 */
export async function applyNoShow(
  tx: Prisma.TransactionClient,
  matchResultId: string,
  {
    noShowParty,
    offerJoin,
  }: {
    noShowParty: MatchParty;
    offerJoin: { userId: string; offer: { authorId: string } };
  },
): Promise<void> {
  const noShowUserId =
    noShowParty === "AUTHOR" ? offerJoin.offer.authorId : offerJoin.userId;
  await tx.user.update({
    where: { id: noShowUserId },
    data: { noShows: { increment: 1 } },
  });
  await tx.matchResult.update({
    where: { id: matchResultId },
    data: { status: "NO_SHOW" },
  });
}

// The reliability percentage itself (4.12): one pure function, so every
// edge case (0, 2, 3+ matches; the boundary itself) has a test without
// touching the database.

const MIN_SCHEDULED_MATCHES_FOR_RATING = 3;

export type ReliabilityCounts = {
  scheduledMatches: number;
  noShows: number;
  lateCancellations: number;
};

export type Reliability = { kind: "new" } | { kind: "rated"; percent: number };

/**
 * "New player" below 3 scheduled matches (decision 2026-10-14 — one bad
 * match shouldn't look like a systemic problem this early); otherwise the
 * percentage of scheduled matches with neither a no-show nor a late
 * cancellation from this player. Clamped at 0: the two counters are always
 * driven by a real scheduled match, but never trust a subtraction to stay
 * in range on its own.
 */
export function computeReliability(counts: ReliabilityCounts): Reliability {
  if (counts.scheduledMatches < MIN_SCHEDULED_MATCHES_FOR_RATING) {
    return { kind: "new" };
  }
  const clean = Math.max(
    0,
    counts.scheduledMatches - counts.noShows - counts.lateCancellations,
  );
  return {
    kind: "rated",
    percent: Math.round((clean / counts.scheduledMatches) * 100),
  };
}

/**
 * "Reliable 95%" or "New player" (decision 2026-10-14) — no colour, just
 * the number. `t` is a translator for the "Reliability" namespace
 * (task 1.20).
 */
export function reliabilityLabel(
  t: (key: string, values?: Record<string, number>) => string,
  reliability: Reliability,
): string {
  return reliability.kind === "new"
    ? t("new")
    : t("rated", { percent: reliability.percent });
}
