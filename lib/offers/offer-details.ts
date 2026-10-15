import { z } from "zod";

import { db } from "@/lib/db";
import type { JoinStatus } from "@/lib/generated/prisma/enums";
import { playersNeeded } from "@/lib/offers/players-needed";

// What /offers/[id] shows (task 3.13), depending on who is looking. Public
// page, and Prisma bypasses RLS (decision for 1.2), so every select is
// explicit: players appear with their public name and level only, and the
// list of requests goes to the offer's author alone.

const playerSelect = { id: true, name: true, selfRatedNtrp: true } as const;

export type OfferPlayer = {
  id: string;
  name: string | null;
  selfRatedNtrp: number | null;
};

// A join's result (task 4.6), if one has been filed — just enough for the
// page to show its own state (submit / pending / confirmed / disputed).
const resultSelect = {
  id: true,
  status: true,
  winner: true,
  reportedBy: true,
  score: true,
  authorEloBefore: true,
  authorEloAfter: true,
  playerEloBefore: true,
  playerEloAfter: true,
} as const;

export type OfferJoinResult = {
  id: string;
  status: "PENDING" | "CONFIRMED" | "DISPUTED" | "NO_SHOW";
  winner: "AUTHOR" | "PLAYER";
  reportedBy: "AUTHOR" | "PLAYER";
  score: unknown;
  authorEloBefore: number | null;
  authorEloAfter: number | null;
  playerEloBefore: number | null;
  playerEloAfter: number | null;
};

export async function getOfferDetails(id: string, viewerId: string | null) {
  // The id comes from the URL; Postgres would throw on a non-UUID.
  if (!z.uuid().safeParse(id).success) {
    return null;
  }

  const offer = await db.sparringOffer.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      format: true,
      hasPartner: true,
      startsAt: true,
      district: true,
      ntrpMin: true,
      ntrpMax: true,
      surface: true,
      courtStatus: true,
      comment: true,
      club: { select: { id: true, name: true, bookingUrl: true } },
      author: { select: playerSelect },
      _count: { select: { joins: { where: { status: "ACCEPTED" } } } },
    },
  });
  if (!offer) {
    return null;
  }

  const isAuthor = viewerId === offer.author.id;
  // The author answers open requests and sees who is in; withdrawn and
  // declined requests are history and stay off the page.
  const joins: {
    id: string;
    status: JoinStatus;
    user: OfferPlayer;
    result: OfferJoinResult | null;
  }[] = isAuthor
    ? await db.offerJoin.findMany({
        where: { offerId: id, status: { in: ["REQUESTED", "ACCEPTED"] } },
        select: {
          id: true,
          status: true,
          user: { select: playerSelect },
          result: { select: resultSelect },
        },
        orderBy: { createdAt: "asc" },
      })
    : [];
  const viewerJoin =
    viewerId && !isAuthor
      ? await db.offerJoin.findUnique({
          where: { offerId_userId: { offerId: id, userId: viewerId } },
          select: { id: true, status: true, result: { select: resultSelect } },
        })
      : null;

  const { _count, ...details } = offer;
  return {
    offer: details,
    spotsLeft: Math.max(0, playersNeeded(offer) - _count.joins),
    isAuthor,
    viewerJoin,
    joins,
  };
}

export type OfferDetails = NonNullable<
  Awaited<ReturnType<typeof getOfferDetails>>
>;
