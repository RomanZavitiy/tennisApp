import { db } from "@/lib/db";
import type { MessageType } from "@/lib/generated/prisma/enums";
import {
  canWriteToThread,
  isJoinThreadParticipant,
} from "@/lib/messages/thread-rules";
import { firstNameAndInitial } from "@/lib/privacy/opponent-name";

export type ThreadMessage = {
  id: string;
  type: MessageType;
  content: string;
  senderId: string | null;
  createdAt: Date;
};

// What the offer page (3.17) shows for one join's private thread: its
// history, oldest first, and whether the viewer may still write to it.
// Null for anyone but the join's player or the offer's author — Prisma
// bypasses RLS (decision for 1.2), so this check is the only thing standing
// between this query and someone else's conversation.
export async function getJoinThread(offerJoinId: string, viewerId: string) {
  const join = await db.offerJoin.findUnique({
    where: { id: offerJoinId },
    select: {
      userId: true,
      status: true,
      offer: { select: { authorId: true, startsAt: true } },
    },
  });
  if (!join || !isJoinThreadParticipant(join, viewerId)) {
    return null;
  }

  const messages: ThreadMessage[] = await db.message.findMany({
    where: { offerJoinId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      type: true,
      content: true,
      senderId: true,
      createdAt: true,
    },
  });

  return {
    messages,
    writable: canWriteToThread(join, join.offer, new Date()),
  };
}

const CLUB_THREAD_MESSAGE_LIMIT = 100;

/**
 * What a club's chat page (O.13) shows: its last 100 messages, oldest
 * first, and the sender names to go with them. Null for anyone who isn't a
 * follower — the same "someone else's thread looks the same as a missing
 * one" convention as getJoinThread. A club's chat is semi-public to its
 * followers (not a 1:1 conversation), so names are first name + last
 * initial (lib/privacy/opponent-name.ts) rather than full names.
 */
export async function getClubThread(clubId: string, viewerId: string) {
  const follow = await db.clubFollow.findUnique({
    where: { userId_clubId: { userId: viewerId, clubId } },
    select: { id: true },
  });
  if (!follow) {
    return null;
  }

  const rows = await db.message.findMany({
    where: { clubId },
    orderBy: { createdAt: "asc" },
    take: CLUB_THREAD_MESSAGE_LIMIT,
    select: {
      id: true,
      type: true,
      content: true,
      senderId: true,
      createdAt: true,
      sender: { select: { name: true } },
    },
  });

  const senderNames: Record<string, string> = {};
  const messages: ThreadMessage[] = rows.map(
    ({ id, type, content, senderId, createdAt: rowCreatedAt }) => ({
      id,
      type,
      content,
      senderId,
      createdAt: rowCreatedAt,
    }),
  );
  for (const row of rows) {
    if (row.senderId) {
      senderNames[row.senderId] = firstNameAndInitial(row.sender?.name ?? null);
    }
  }

  return { messages, senderNames, writable: true };
}
