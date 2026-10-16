import { db } from "@/lib/db";
import { firstNameAndInitial } from "@/lib/privacy/opponent-name";

// "Download my data" (task 6.14): everything the task asks for — profile,
// offers, join requests, the user's own chat messages, and matches — in one
// JSON-able object. An opponent in a match is never named in full, only
// firstNameAndInitial() of it: the DoD is "no other player's personal data
// beyond that". Nothing here is a Date — every timestamp is already an ISO
// string, since the whole point is to hand this back as a downloadable file.
export type UserDataExport = {
  exportedAt: string;
  profile: {
    id: string;
    email: string | null;
    name: string | null;
    birthDate: string | null;
    gender: string | null;
    district: string | null;
    selfRatedNtrp: number | null;
    elo: number | null;
    matchesPlayed: number;
    locale: string;
    createdAt: string;
  };
  offers: Array<{
    id: string;
    status: string;
    format: string;
    startsAt: string;
    district: string | null;
    clubId: string | null;
    comment: string | null;
    courtStatus: string;
    createdAt: string;
  }>;
  joins: Array<{
    id: string;
    offerId: string;
    status: string;
    createdAt: string;
  }>;
  messages: Array<{
    id: string;
    offerJoinId: string | null;
    offerId: string | null;
    content: string;
    createdAt: string;
  }>;
  matches: Array<{
    id: string;
    status: string;
    startsAt: string;
    opponent: string;
    score: unknown;
    /** "me" / "opponent", relative to the exported user — never AUTHOR/PLAYER. */
    winner: "me" | "opponent" | null;
    reportedBy: "me" | "opponent";
    noShowParty: "me" | "opponent" | null;
    createdAt: string;
  }>;
};

export async function exportUserData(userId: string): Promise<UserDataExport> {
  const [user, offers, joins, messages, matchResults] = await Promise.all([
    db.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        birthDate: true,
        gender: true,
        district: true,
        selfRatedNtrp: true,
        elo: true,
        matchesPlayed: true,
        locale: true,
        createdAt: true,
      },
    }),
    db.sparringOffer.findMany({
      where: { authorId: userId },
      select: {
        id: true,
        status: true,
        format: true,
        startsAt: true,
        district: true,
        clubId: true,
        comment: true,
        courtStatus: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    db.offerJoin.findMany({
      where: { userId },
      select: { id: true, offerId: true, status: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    db.message.findMany({
      where: { senderId: userId },
      select: {
        id: true,
        offerJoinId: true,
        offerId: true,
        content: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    db.matchResult.findMany({
      where: {
        offerJoin: { OR: [{ userId }, { offer: { authorId: userId } }] },
      },
      select: {
        id: true,
        status: true,
        score: true,
        winner: true,
        reportedBy: true,
        noShowParty: true,
        createdAt: true,
        offerJoin: {
          select: {
            userId: true,
            user: { select: { name: true } },
            offer: {
              select: {
                authorId: true,
                startsAt: true,
                author: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    profile: {
      ...user,
      birthDate: user.birthDate?.toISOString().slice(0, 10) ?? null,
      createdAt: user.createdAt.toISOString(),
    },
    offers: offers.map((offer) => ({
      ...offer,
      startsAt: offer.startsAt.toISOString(),
      createdAt: offer.createdAt.toISOString(),
    })),
    joins: joins.map((join) => ({
      ...join,
      createdAt: join.createdAt.toISOString(),
    })),
    messages: messages.map((message) => ({
      ...message,
      createdAt: message.createdAt.toISOString(),
    })),
    matches: matchResults.map((result) => {
      // Which side of the join the exported user is — the same AUTHOR/
      // PLAYER convention join-transitions.ts and result-rules.ts use.
      const selfParty =
        result.offerJoin.userId === userId ? "PLAYER" : "AUTHOR";
      const opponentName =
        selfParty === "PLAYER"
          ? result.offerJoin.offer.author.name
          : result.offerJoin.user.name;
      const relativeTo = (
        party: typeof result.winner,
      ): "me" | "opponent" | null =>
        party === null ? null : party === selfParty ? "me" : "opponent";

      return {
        id: result.id,
        status: result.status,
        startsAt: result.offerJoin.offer.startsAt.toISOString(),
        opponent: firstNameAndInitial(opponentName),
        score: result.score,
        winner: relativeTo(result.winner),
        // Never null, unlike winner/noShowParty — every result has a filer.
        reportedBy: result.reportedBy === selfParty ? "me" : "opponent",
        noShowParty: relativeTo(result.noShowParty),
        createdAt: result.createdAt.toISOString(),
      };
    }),
  };
}
