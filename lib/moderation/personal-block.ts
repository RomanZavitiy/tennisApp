import { db } from "@/lib/db";

// A player's own "don't show me this person" (slice R, decision for task
// R.1): separate from an admin's account-wide blockedAt (block-rules.ts) --
// this one only ever affects the two people involved, and either side can
// undo it any time. Every DB access for the feature lives here, so
// join-rules.ts, feed.ts and thread-data.ts never query user_blocks
// directly.

/** Whether `blockerId` has personally blocked `blockedId`. */
export async function isBlocked(
  blockerId: string,
  blockedId: string,
): Promise<boolean> {
  const block = await db.userBlock.findUnique({
    where: { blockerId_blockedId: { blockerId, blockedId } },
    select: { id: true },
  });
  return block !== null;
}

/**
 * Whether either side has blocked the other (task R.2: the effect is
 * two-sided) — join requests and thread messages between a blocker and a
 * blocked player are refused regardless of who blocked whom.
 */
export async function isBlockedEitherWay(
  aId: string,
  bId: string,
): Promise<boolean> {
  const block = await db.userBlock.findFirst({
    where: {
      OR: [
        { blockerId: aId, blockedId: bId },
        { blockerId: bId, blockedId: aId },
      ],
    },
    select: { id: true },
  });
  return block !== null;
}

/**
 * Every id `userId` shares a block with, either direction — the feed's
 * exclusion list (task R.2), same idiom as OfferDismissal's in
 * lib/offers/feed.ts.
 */
export async function blockedCounterpartIds(userId: string): Promise<string[]> {
  const rows = await db.userBlock.findMany({
    where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
    select: { blockerId: true, blockedId: true },
  });
  return rows.map((row) =>
    row.blockerId === userId ? row.blockedId : row.blockerId,
  );
}

export type BlockedPlayer = {
  id: string;
  name: string | null;
  avatarPath: string | null;
};

/** The players `userId` has blocked (task R.3's "Заблоковані" list) — only
 * the blocker's own side: you can't unblock someone who blocked you. */
export async function getBlockedPlayers(
  userId: string,
): Promise<BlockedPlayer[]> {
  const rows = await db.userBlock.findMany({
    where: { blockerId: userId },
    orderBy: { createdAt: "desc" },
    select: {
      blocked: { select: { id: true, name: true, avatarPath: true } },
    },
  });
  return rows.map((row) => row.blocked);
}
