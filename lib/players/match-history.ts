import { db } from "@/lib/db";
import type { District, OfferFormat } from "@/lib/generated/prisma/enums";
import type { SetScore } from "@/lib/validation/match-result";

// A player's confirmed matches (task 4.9) for their public page: opponent,
// score (the player's own games first — see result-labels.ts) and how much
// their ELO moved. PENDING and DISPUTED results never appear here — only a
// CONFIRMED one actually changed anything public, and a pending result's
// score is between the two players until the other side has had a chance
// to confirm or dispute it (decision 2026-10-14).

export type MatchHistoryEntry = {
  id: string;
  opponentId: string;
  opponentName: string | null;
  /** Author-first, as stored — pass with `wasAuthor` to result-labels.ts's `formatScoreFor`. */
  sets: SetScore[];
  wasAuthor: boolean;
  won: boolean;
  eloBefore: number;
  eloAfter: number;
  /** The finished offer's own facts, for "play again" (task Q.1). */
  startsAt: Date;
  durationMinutes: number;
  format: OfferFormat;
  clubId: string | null;
  district: District | null;
  ntrpMin: number | null;
  ntrpMax: number | null;
};

export async function getMatchHistory(
  playerId: string,
): Promise<MatchHistoryEntry[]> {
  const results = await db.matchResult.findMany({
    where: {
      status: "CONFIRMED",
      offerJoin: {
        OR: [{ userId: playerId }, { offer: { authorId: playerId } }],
      },
    },
    select: {
      id: true,
      winner: true,
      score: true,
      authorEloBefore: true,
      authorEloAfter: true,
      playerEloBefore: true,
      playerEloAfter: true,
      offerJoin: {
        select: {
          userId: true,
          user: { select: { id: true, name: true } },
          offer: {
            select: {
              startsAt: true,
              authorId: true,
              author: { select: { id: true, name: true } },
              durationMinutes: true,
              format: true,
              clubId: true,
              district: true,
              ntrpMin: true,
              ntrpMax: true,
            },
          },
        },
      },
    },
    orderBy: { offerJoin: { offer: { startsAt: "desc" } } },
  });

  return results.map((result) => {
    const wasAuthor = result.offerJoin.offer.authorId === playerId;
    const opponent = wasAuthor
      ? result.offerJoin.user
      : result.offerJoin.offer.author;
    const eloBefore = wasAuthor
      ? result.authorEloBefore
      : result.playerEloBefore;
    const eloAfter = wasAuthor ? result.authorEloAfter : result.playerEloAfter;
    // The CHECK tying these to status === CONFIRMED (4.4) guarantees both
    // are set for a result this query only selects when CONFIRMED.
    if (eloBefore === null || eloAfter === null) {
      throw new Error("A confirmed result is missing its ELO snapshot.");
    }

    return {
      id: result.id,
      opponentId: opponent.id,
      opponentName: opponent.name,
      sets: result.score as SetScore[],
      wasAuthor,
      won: result.winner === (wasAuthor ? "AUTHOR" : "PLAYER"),
      eloBefore,
      eloAfter,
      startsAt: result.offerJoin.offer.startsAt,
      durationMinutes: result.offerJoin.offer.durationMinutes,
      format: result.offerJoin.offer.format,
      clubId: result.offerJoin.offer.clubId,
      district: result.offerJoin.offer.district,
      ntrpMin: result.offerJoin.offer.ntrpMin,
      ntrpMax: result.offerJoin.offer.ntrpMax,
    };
  });
}

export type MatchSummary = { played: number; won: number; lost: number };

/** The win/loss line on a profile (slice K6), from the same confirmed
 * matches the history lists — the two can never disagree. */
export function summarizeMatches(matches: MatchHistoryEntry[]): MatchSummary {
  const won = matches.filter((match) => match.won).length;
  return { played: matches.length, won, lost: matches.length - won };
}
