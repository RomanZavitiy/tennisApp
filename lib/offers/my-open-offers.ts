import { db } from "@/lib/db";
import type { District, Sport } from "@/lib/generated/prisma/enums";

// "Invite to game" (task S1.4): which of the inviter's own offers they can
// invite into. Only OPEN and not yet started — a FULL offer has no place
// left for the invite to fill (inviteChangeRefusal would refuse it at
// accept time anyway, but there's no reason to offer it in the picker).

export type MyOpenOffer = {
  id: string;
  startsAt: Date;
  district: District | null;
  club: { name: string } | null;
};

export async function getMyOpenOffers(
  authorId: string,
  now = new Date(),
  // Slice PD2: "Looking for a game" cards are for one sport, so only the
  // inviter's games in that sport are offered there. Unset — both sports.
  sport?: Sport,
): Promise<MyOpenOffer[]> {
  return db.sparringOffer.findMany({
    where: {
      authorId,
      status: "OPEN",
      startsAt: { gt: now },
      ...(sport ? { sport } : {}),
    },
    orderBy: { startsAt: "asc" },
    select: {
      id: true,
      startsAt: true,
      district: true,
      club: { select: { name: true } },
    },
  });
}
