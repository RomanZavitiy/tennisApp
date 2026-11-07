import { z } from "zod";

import { db } from "@/lib/db";
import type { JoinStatus } from "@/lib/generated/prisma/enums";
import { playersNeeded } from "@/lib/offers/players-needed";
import { waitlistPosition } from "@/lib/offers/waitlist-rules";
import { computeReliability, type Reliability } from "@/lib/rating/reliability";

// What /offers/[id] shows (task 3.13), depending on who is looking. Public
// page, and Prisma bypasses RLS (decision for 1.2), so every select is
// explicit: players appear with their public name, level and reliability
// (4.12) only, and the list of requests goes to the offer's author alone.

const playerSelect = {
  id: true,
  name: true,
  avatarPath: true,
  selfRatedNtrp: true,
  scheduledMatches: true,
  noShows: true,
  lateCancellations: true,
} as const;

export type OfferPlayer = {
  id: string;
  name: string | null;
  avatarPath: string | null;
  selfRatedNtrp: number | null;
  reliability: Reliability;
};

function toOfferPlayer(row: {
  id: string;
  name: string | null;
  avatarPath: string | null;
  selfRatedNtrp: number | null;
  scheduledMatches: number;
  noShows: number;
  lateCancellations: number;
}): OfferPlayer {
  const { scheduledMatches, noShows, lateCancellations, ...rest } = row;
  return {
    ...rest,
    reliability: computeReliability({
      scheduledMatches,
      noShows,
      lateCancellations,
    }),
  };
}

// A join's result (task 4.6), if one has been filed — just enough for the
// page to show its own state (submit / pending / confirmed / disputed).
const resultSelect = {
  id: true,
  status: true,
  winner: true,
  reportedBy: true,
  noShowParty: true,
  score: true,
  authorEloBefore: true,
  authorEloAfter: true,
  playerEloBefore: true,
  playerEloAfter: true,
} as const;

export type OfferJoinResult = {
  id: string;
  status: "PENDING" | "CONFIRMED" | "DISPUTED" | "NO_SHOW" | "ANNULLED";
  /** Null for a no-show report (4.10) — there's no score to have a winner. */
  winner: "AUTHOR" | "PLAYER" | null;
  reportedBy: "AUTHOR" | "PLAYER";
  /** Set only for a no-show report: who didn't show up. */
  noShowParty: "AUTHOR" | "PLAYER" | null;
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
      durationMinutes: true,
      district: true,
      ntrpMin: true,
      ntrpMax: true,
      surface: true,
      courtStatus: true,
      comment: true,
      club: {
        select: {
          id: true,
          name: true,
          bookingUrl: true,
          phone: true,
          bookingMode: true,
        },
      },
      author: { select: playerSelect },
      _count: { select: { joins: { where: { status: "ACCEPTED" } } } },
      // K.22: whether there's a booking tied to this offer the author could
      // still cancel alongside it. At most one in practice, but a prior
      // declined/cancelled attempt could leave more than one row behind.
      bookings: {
        where: { status: { in: ["PENDING", "CONFIRMED"] } },
        select: { id: true, status: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
  if (!offer) {
    return null;
  }

  const isAuthor = viewerId === offer.author.id;
  // The author answers open requests and sees who is in; withdrawn and
  // declined requests are history and stay off the page. A waitlist
  // promotion (task T.3) sorts first, so it reads as the priority request
  // it is, whatever order it landed in relative to older ones.
  const rawJoins = isAuthor
    ? await db.offerJoin.findMany({
        where: { offerId: id, status: { in: ["REQUESTED", "ACCEPTED"] } },
        select: {
          id: true,
          status: true,
          fromWaitlist: true,
          user: { select: playerSelect },
          result: { select: resultSelect },
        },
        orderBy: [{ fromWaitlist: "desc" }, { createdAt: "asc" }],
      })
    : [];
  const joins: {
    id: string;
    status: JoinStatus;
    fromWaitlist: boolean;
    user: OfferPlayer;
    result: OfferJoinResult | null;
  }[] = rawJoins.map((join) => ({ ...join, user: toOfferPlayer(join.user) }));
  const viewerJoin =
    viewerId && !isAuthor
      ? await db.offerJoin.findUnique({
          where: { offerId_userId: { offerId: id, userId: viewerId } },
          select: { id: true, status: true, result: { select: resultSelect } },
        })
      : null;
  // S1.3's "you were invited" banner: a player's own pending invite to this
  // offer, if any — the mirror of viewerJoin above.
  const viewerInvite =
    viewerId && !isAuthor
      ? await db.offerInvite.findUnique({
          where: { offerId_inviteeId: { offerId: id, inviteeId: viewerId } },
          select: { id: true, status: true },
        })
      : null;
  // T.2: the player's own place in line, only worth computing on a FULL
  // offer — every other status has no waitlist to show a position in.
  const viewerWaitlistPosition =
    viewerId && !isAuthor && offer.status === "FULL"
      ? waitlistPosition(
          await db.offerWaitlist.findMany({
            where: { offerId: id },
            orderBy: { createdAt: "asc" },
            select: { userId: true },
          }),
          viewerId,
        )
      : null;

  const { _count, author, bookings, ...details } = offer;
  return {
    offer: {
      ...details,
      author: toOfferPlayer(author),
      // .at(), not [0]: its return type stays T | undefined even without
      // noUncheckedIndexedAccess, so activeBooking keeps its real null case
      // instead of TS treating the empty-array branch as unreachable.
      activeBooking: bookings.at(0) ?? null,
    },
    spotsLeft: Math.max(0, playersNeeded(offer) - _count.joins),
    isAuthor,
    viewerJoin,
    viewerInvite,
    viewerWaitlistPosition,
    joins,
  };
}

export type OfferDetails = NonNullable<
  Awaited<ReturnType<typeof getOfferDetails>>
>;
