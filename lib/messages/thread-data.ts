import { db } from "@/lib/db";
import type { MessageType } from "@/lib/generated/prisma/enums";
import {
  canWriteToThread,
  isJoinThreadParticipant,
} from "@/lib/messages/thread-rules";

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
