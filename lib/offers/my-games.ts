import { db } from "@/lib/db";
import type { District } from "@/lib/generated/prisma/enums";

// "My games" on the player's own profile (slice K6): every upcoming game the
// player is part of, in one list — offers they posted (with how many
// requests wait for an answer), and offers they asked to join or were
// accepted into. Cancelled offers and finished games aren't listed; past
// matches are the match history's job.

export type MyGameRole = "AUTHOR" | "ACCEPTED" | "REQUESTED";

export type MyGame = {
  offerId: string;
  role: MyGameRole;
  startsAt: Date;
  durationMinutes: number;
  district: District | null;
  club: { name: string } | null;
  /** AUTHOR only: requests still waiting for accept/decline. */
  pendingRequests: number;
};

const offerSelect = {
  id: true,
  startsAt: true,
  durationMinutes: true,
  district: true,
  club: { select: { name: true } },
} as const;

export async function getMyUpcomingGames(
  userId: string,
  now = new Date(),
): Promise<MyGame[]> {
  const upcoming = {
    status: { in: ["OPEN" as const, "FULL" as const] },
    startsAt: { gt: now },
  };

  const [authored, joins] = await Promise.all([
    db.sparringOffer.findMany({
      where: { authorId: userId, ...upcoming },
      select: {
        ...offerSelect,
        _count: {
          select: { joins: { where: { status: "REQUESTED" as const } } },
        },
      },
    }),
    db.offerJoin.findMany({
      where: {
        userId,
        status: { in: ["REQUESTED", "ACCEPTED"] },
        offer: upcoming,
      },
      select: { status: true, offer: { select: offerSelect } },
    }),
  ]);

  const games: MyGame[] = [
    ...authored.map(({ id, _count, ...offer }) => ({
      ...offer,
      offerId: id,
      role: "AUTHOR" as const,
      pendingRequests: _count.joins,
    })),
    ...joins.map(({ status, offer: { id, ...offer } }) => ({
      ...offer,
      offerId: id,
      role:
        status === "ACCEPTED" ? ("ACCEPTED" as const) : ("REQUESTED" as const),
      pendingRequests: 0,
    })),
  ];
  return games.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
}
