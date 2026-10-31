import { db } from "@/lib/db";
import type {
  District,
  MatchParty,
  ReportReason,
} from "@/lib/generated/prisma/enums";

// What the admin queue (task 6.3) shows: open reports, currently blocked
// players, and disputed results. Public to nobody but requireAdmin() — the
// pages that call these are the only readers.

export type OpenReport = {
  id: string;
  createdAt: Date;
  reason: ReportReason;
  comment: string | null;
  reporter: { id: string; name: string | null };
  targetUser: { id: string; name: string | null };
  offer: { id: string; startsAt: Date } | null;
  message: { id: string; content: string } | null;
};

export async function getOpenReports(): Promise<OpenReport[]> {
  return db.report.findMany({
    where: { status: "OPEN" },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      createdAt: true,
      reason: true,
      comment: true,
      reporter: { select: { id: true, name: true } },
      targetUser: { select: { id: true, name: true } },
      offer: { select: { id: true, startsAt: true } },
      message: { select: { id: true, content: true } },
    },
  });
}

export type BlockedPlayer = {
  id: string;
  name: string | null;
  blockedAt: Date;
};

export async function getBlockedPlayers(): Promise<BlockedPlayer[]> {
  const rows = await db.user.findMany({
    where: { blockedAt: { not: null } },
    orderBy: { blockedAt: "desc" },
    select: { id: true, name: true, blockedAt: true },
  });
  // The where clause guarantees blockedAt is set; Prisma's type can't
  // express that, so it comes back as Date | null here.
  return rows.map((row) => {
    if (!row.blockedAt) {
      throw new Error("A blocked player's blockedAt was null.");
    }
    return { ...row, blockedAt: row.blockedAt };
  });
}

export type DisputedResult = {
  id: string;
  score: unknown;
  winner: MatchParty | null;
  noShowParty: MatchParty | null;
  reportedBy: MatchParty;
  offerJoin: {
    id: string;
    offerId: string;
    user: { id: string; name: string | null };
    offer: {
      startsAt: Date;
      author: { id: string; name: string | null };
    };
  };
};

export async function getDisputedResults(): Promise<DisputedResult[]> {
  return db.matchResult.findMany({
    where: { status: "DISPUTED" },
    orderBy: { updatedAt: "asc" },
    select: {
      id: true,
      score: true,
      winner: true,
      noShowParty: true,
      reportedBy: true,
      offerJoin: {
        select: {
          id: true,
          offerId: true,
          user: { select: { id: true, name: true } },
          offer: {
            select: {
              startsAt: true,
              author: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  });
}

export type OpenClubSubmission = {
  id: string;
  createdAt: Date;
  name: string;
  address: string;
  districtGuess: District | null;
  notes: string | null;
  submittedBy: { id: string; name: string | null };
};

/** Slice M, task M.8: a player's club tip waiting on a decision (M.9). */
export async function getOpenClubSubmissions(): Promise<OpenClubSubmission[]> {
  return db.clubSubmission.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      createdAt: true,
      name: true,
      address: true,
      districtGuess: true,
      notes: true,
      submittedBy: { select: { id: true, name: true } },
    },
  });
}
