import type { JoinStatus } from "@/lib/generated/prisma/enums";

// Who may read/write a join's private thread (decision 3.1, task 3.16): its
// two participants — the player who filed the join, and the offer's author.
// Pure, so every rule has a test; the server action and the page's data
// loader only load the rows and act on the answer.

export function isJoinThreadParticipant(
  join: { userId: string; offer: { authorId: string } },
  userId: string,
): boolean {
  return userId === join.userId || userId === join.offer.authorId;
}

// Writable while the join is still live (REQUESTED or ACCEPTED) and not too
// long after the match; past that, the thread stays readable as history
// (decision 3.1) but the server action refuses new messages.
const READ_ONLY_AFTER_MATCH_DAYS = 7;

export function canWriteToThread(
  join: { status: JoinStatus },
  offer: { startsAt: Date },
  now: Date,
): boolean {
  if (join.status !== "REQUESTED" && join.status !== "ACCEPTED") {
    return false;
  }
  const readOnlyFrom = new Date(
    offer.startsAt.getTime() + READ_ONLY_AFTER_MATCH_DAYS * 86_400_000,
  );
  return now <= readOnlyFrom;
}

// Who may write to a club's chat (session O2, task O.9): any follower, same
// idea as isJoinThreadParticipant above but with one membership flag instead
// of two ids, since club_follows has already answered "is this a follower"
// by the time a caller has this. Blocked users never write — repeated here
// even though every caller already runs blockedRefusal first (task 6.4), so
// the rule reads correctly on its own.
export function canWriteToClubThread(
  isFollower: boolean,
  user: { blockedAt: Date | null },
): boolean {
  return isFollower && user.blockedAt === null;
}
