import { db } from "@/lib/db";
import {
  postSystemMessage,
  RESULT_AUTO_CONFIRMED_MESSAGE,
} from "@/lib/messages/post-system-message";
import { applyMatchEloFromJoin } from "@/lib/rating/apply-elo";

// Confirms every PENDING result whose 72h window (decision 2026-10-14) has
// passed — the cron job's (5.8) one task. One result at a time, each in its
// own transaction: a problem with one row (a bug, a bad write from before
// this code existed) can't block the rest of the batch. Each transaction
// locks the row and re-checks it's still PENDING, the same guard
// confirmResult (4.7) uses, so a result a human settles in the gap between
// the query below and its own transaction is left alone — never double-
// applied, same idempotency the manual path's test covers.
export async function autoConfirmExpiredResults(
  now: Date = new Date(),
): Promise<number> {
  const due = await db.matchResult.findMany({
    where: { status: "PENDING", autoConfirmAt: { lte: now } },
    select: { id: true },
  });

  let confirmedCount = 0;
  for (const { id } of due) {
    const offerJoinId = await db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT 1 FROM match_results WHERE id = ${id}::uuid FOR UPDATE`;
      const result = await tx.matchResult.findUnique({
        where: { id },
        select: {
          status: true,
          winner: true,
          offerJoin: {
            select: {
              id: true,
              userId: true,
              offer: {
                select: {
                  authorId: true,
                  author: { select: { elo: true, matchesPlayed: true } },
                },
              },
              user: { select: { elo: true, matchesPlayed: true } },
            },
          },
        },
      });
      if (!result || result.status !== "PENDING") {
        return null;
      }

      await applyMatchEloFromJoin(tx, id, {
        winner: result.winner,
        offerJoin: result.offerJoin,
      });
      return result.offerJoin.id;
    });

    if (offerJoinId) {
      await postSystemMessage({ offerJoinId }, RESULT_AUTO_CONFIRMED_MESSAGE);
      confirmedCount++;
    }
  }
  return confirmedCount;
}
