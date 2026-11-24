import { db } from "@/lib/db";
import type { MatchResultStatus, Sport } from "@/lib/generated/prisma/enums";
import {
  getRatedInDoubles,
  isFeedbackWindowOpen,
} from "@/lib/feedback/match-feedback";
import type { DoublesEloChange } from "@/lib/rating/doubles-elo";

// What /offers/[id] shows about a doubles game's result (slice PD4), and
// only to the people who played it: the author and the accepted players.
// Nobody else gets this loaded — the pairs, score and rating changes are
// the players' own business, same as a singles result.

export type DoublesPlayer = { id: string; name: string | null };

export type DoublesResultView = {
  id: string;
  status: MatchResultStatus;
  authorPartnerId: string | null;
  opponent1Id: string | null;
  opponent2Id: string | null;
  score: unknown;
  winner: "AUTHOR" | "PLAYER" | null;
  reportedById: string;
  noShowUserId: string | null;
  eloChanges: DoublesEloChange[] | null;
};

export type DoublesGameView = {
  sport: Sport;
  hasPartner: boolean;
  /** The author first, then the accepted players. */
  players: DoublesPlayer[];
  result: DoublesResultView | null;
  /** Players the viewer may still rate (confirmed, within 7 days). */
  toRate: DoublesPlayer[];
};

export async function getDoublesGameView(
  offerId: string,
  viewerId: string,
): Promise<DoublesGameView | null> {
  const offer = await db.sparringOffer.findUnique({
    where: { id: offerId },
    select: {
      format: true,
      sport: true,
      hasPartner: true,
      startsAt: true,
      author: { select: { id: true, name: true } },
      joins: {
        where: { status: "ACCEPTED" },
        select: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: "asc" },
      },
      doublesResult: {
        select: {
          id: true,
          status: true,
          updatedAt: true,
          authorPartnerId: true,
          opponent1Id: true,
          opponent2Id: true,
          score: true,
          winner: true,
          reportedById: true,
          noShowUserId: true,
          eloChanges: true,
        },
      },
    },
  });
  if (!offer || offer.format !== "DOUBLES" || offer.startsAt > new Date()) {
    return null;
  }
  const players = [offer.author, ...offer.joins.map((join) => join.user)];
  if (!players.some((player) => player.id === viewerId)) {
    return null;
  }

  const raw = offer.doublesResult;
  let toRate: DoublesPlayer[] = [];
  if (
    raw?.status === "CONFIRMED" &&
    isFeedbackWindowOpen(raw.updatedAt, new Date())
  ) {
    const rated = await getRatedInDoubles(raw.id, viewerId);
    toRate = players.filter(
      (player) => player.id !== viewerId && !rated.has(player.id),
    );
  }

  return {
    sport: offer.sport,
    hasPartner: offer.hasPartner,
    players,
    result: raw
      ? {
          id: raw.id,
          status: raw.status,
          authorPartnerId: raw.authorPartnerId,
          opponent1Id: raw.opponent1Id,
          opponent2Id: raw.opponent2Id,
          score: raw.score,
          winner: raw.winner,
          reportedById: raw.reportedById,
          noShowUserId: raw.noShowUserId,
          // Written only by settleDoublesResult, in exactly this shape.
          eloChanges: raw.eloChanges as DoublesEloChange[] | null,
        }
      : null,
    toRate,
  };
}
