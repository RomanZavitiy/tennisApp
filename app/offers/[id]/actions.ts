"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireOnboardedUser } from "@/lib/auth/require-onboarded-user";
import { db } from "@/lib/db";
import {
  COURT_BOOKED_MESSAGE,
  postSystemMessage,
  THREAD_WELCOME_MESSAGE,
} from "@/lib/messages/post-system-message";
import {
  canWriteToThread,
  isJoinThreadParticipant,
} from "@/lib/messages/thread-rules";
import { blockedRefusal } from "@/lib/moderation/block-rules";
import { notify } from "@/lib/notifications/notify";
import { canCancelOffer } from "@/lib/offers/cancel-rules";
import { JOIN_REFUSAL_MESSAGES, joinRefusal } from "@/lib/offers/join-rules";
import {
  ACTION_ACTOR,
  joinChangeRefusal,
  nextJoinStatus,
  offerStatusFor,
  type JoinAction,
  type JoinChangeRefusal,
} from "@/lib/offers/join-transitions";
import { checkRateLimit } from "@/lib/rate-limit/check-rate-limit";
import {
  isLateCancellation,
  recordLateCancellation,
  recordScheduledMatch,
} from "@/lib/rating/reliability";
import { messageContentSchema } from "@/lib/validation/message";

export type RequestToJoinResult = { ok: true } | { ok: false; message: string };
export type JoinChangeResult = RequestToJoinResult;

const NOT_FOUND = "This offer doesn't exist.";

// "Ask to join" on /offers/[id] (the page comes in 3.13). The player is the
// signed-in one with a finished profile — never an id from the request — and
// the answer carries no details of either side: contact happens in the
// join's private thread (3.1), never by phone or email.
export async function requestToJoin(
  offerId: unknown,
): Promise<RequestToJoinResult> {
  const player = await requireOnboardedUser();

  const blocked = blockedRefusal(player);
  if (blocked) {
    return { ok: false, message: blocked };
  }

  const id = z.uuid().safeParse(offerId);
  if (!id.success) {
    return { ok: false, message: NOT_FOUND };
  }
  const limited = await checkRateLimit(player.id, "JOIN_REQUEST");
  if (!limited.ok) {
    return limited;
  }

  const offer = await db.sparringOffer.findUnique({
    where: { id: id.data },
    select: { authorId: true, status: true, startsAt: true },
  });
  if (!offer) {
    return { ok: false, message: NOT_FOUND };
  }
  const existing = await db.offerJoin.findUnique({
    where: { offerId_userId: { offerId: id.data, userId: player.id } },
    select: { id: true, status: true },
  });

  const refusal = joinRefusal({
    offer,
    playerId: player.id,
    existing,
    now: new Date(),
  });
  if (refusal) {
    return { ok: false, message: JOIN_REFUSAL_MESSAGES[refusal] };
  }

  // Both writes only succeed from the state checked above, so a double click
  // or two tabs can't make a second request: skipDuplicates is ON CONFLICT
  // DO NOTHING on the (offer, player) pair, and the update needs the row to
  // still be WITHDRAWN. A truly new join also opens its private thread
  // (decision 3.1: the thread exists from the moment of the request) with a
  // welcome note — reopening a withdrawn one reuses the same thread, so it
  // doesn't get a second welcome.
  if (existing) {
    const { count } = await db.offerJoin.updateMany({
      where: { id: existing.id, status: "WITHDRAWN" },
      data: { status: "REQUESTED" },
    });
    if (count === 0) {
      return { ok: false, message: JOIN_REFUSAL_MESSAGES.ALREADY_REQUESTED };
    }
  } else {
    const created = (
      await db.offerJoin.createManyAndReturn({
        data: [{ offerId: id.data, userId: player.id }],
        select: { id: true },
        skipDuplicates: true,
      })
    ).at(0);
    if (!created) {
      return { ok: false, message: JOIN_REFUSAL_MESSAGES.ALREADY_REQUESTED };
    }
    await postSystemMessage(
      { offerJoinId: created.id },
      THREAD_WELCOME_MESSAGE,
    );
  }

  // Task 5.16: "new join request", to the author — on a reopened request
  // too, since it's a fresh ask either way.
  await notify(offer.authorId, { kind: "JOIN_REQUESTED", offerId: id.data });

  revalidatePath(`/offers/${id.data}`);
  return { ok: true };
}

export type SendMessageResult =
  | {
      ok: true;
      sentMessage: {
        id: string;
        type: "TEXT";
        content: string;
        senderId: string;
        createdAt: string;
      };
    }
  | { ok: false; message: string };

const THREAD_NOT_FOUND = "This conversation doesn't exist.";
const THREAD_READ_ONLY = "This conversation is read-only now.";

// "Send" in a join's private thread (task 3.16). Only the join's player or
// the offer's author — never an id from the request — and only while the
// thread is still writable (lib/messages/thread-rules.ts); content is
// server-checked again even though the UI (3.17) already limits it. Never
// rendered as HTML: the thread (3.17) shows `content` as plain text, and
// React escapes it like any other string.
export async function sendMessage(
  offerJoinId: unknown,
  content: unknown,
): Promise<SendMessageResult> {
  const user = await requireOnboardedUser();

  const blocked = blockedRefusal(user);
  if (blocked) {
    return { ok: false, message: blocked };
  }

  const id = z.uuid().safeParse(offerJoinId);
  if (!id.success) {
    return { ok: false, message: THREAD_NOT_FOUND };
  }
  const text = messageContentSchema.safeParse(content);
  if (!text.success) {
    return {
      ok: false,
      message: text.error.issues[0]?.message ?? THREAD_NOT_FOUND,
    };
  }
  const limited = await checkRateLimit(user.id, "MESSAGE");
  if (!limited.ok) {
    return limited;
  }

  const join = await db.offerJoin.findUnique({
    where: { id: id.data },
    select: {
      userId: true,
      status: true,
      offerId: true,
      offer: { select: { authorId: true, startsAt: true } },
    },
  });
  // Someone else's thread looks the same as a missing one.
  if (!join || !isJoinThreadParticipant(join, user.id)) {
    return { ok: false, message: THREAD_NOT_FOUND };
  }
  if (!canWriteToThread(join, join.offer, new Date())) {
    return { ok: false, message: THREAD_READ_ONLY };
  }

  const message = await db.message.create({
    data: { offerJoinId: id.data, senderId: user.id, content: text.data },
    select: { id: true, content: true, senderId: true, createdAt: true },
  });

  // Task 5.16: "new message", to the other side of this thread — grouped
  // to at most one push per thread per 5 minutes (lib/notifications/notify).
  const recipientId =
    user.id === join.offer.authorId ? join.userId : join.offer.authorId;
  await notify(recipientId, {
    kind: "NEW_MESSAGE",
    offerId: join.offerId,
    offerJoinId: id.data,
  });

  revalidatePath(`/offers/${join.offerId}`);
  return {
    ok: true,
    sentMessage: {
      id: message.id,
      type: "TEXT",
      content: message.content,
      senderId: message.senderId ?? user.id,
      createdAt: message.createdAt.toISOString(),
    },
  };
}

const JOIN_NOT_FOUND = "This request doesn't exist.";

const CHANGE_REFUSAL_MESSAGES: Record<JoinChangeRefusal, string> = {
  NOT_ALLOWED: "This request can't be changed any more.",
  CANCELLED: "This offer has been cancelled.",
  STARTED: "This game has already started.",
  FULL: "Every place in this game is taken.",
};

/** The author accepts a request. Fills the offer once every place is taken. */
export async function acceptJoin(joinId: unknown): Promise<JoinChangeResult> {
  return changeJoin(joinId, "ACCEPT");
}

/** The author declines a request. */
export async function declineJoin(joinId: unknown): Promise<JoinChangeResult> {
  return changeJoin(joinId, "DECLINE");
}

/** The player takes back their request or their accepted place. */
export async function withdrawJoin(joinId: unknown): Promise<JoinChangeResult> {
  return changeJoin(joinId, "WITHDRAW");
}

// One path for every status change after the request (3.12). The offer row
// is locked first, so two changes to the same offer run one after the other:
// two "accept" clicks on the last place can't both see it free. The rules are
// lib/offers/join-transitions.ts; this only reads, checks and writes.
async function changeJoin(
  joinId: unknown,
  action: JoinAction,
): Promise<JoinChangeResult> {
  const user = await requireOnboardedUser();

  const id = z.uuid().safeParse(joinId);
  if (!id.success) {
    return { ok: false, message: JOIN_NOT_FOUND };
  }

  const result = await db.$transaction(async (tx) => {
    const join = await tx.offerJoin.findUnique({
      where: { id: id.data },
      select: {
        offerId: true,
        userId: true,
        offer: { select: { authorId: true } },
      },
    });
    // Someone else's request looks the same as a missing one.
    const actorId =
      ACTION_ACTOR[action] === "AUTHOR" ? join?.offer.authorId : join?.userId;
    if (!join || actorId !== user.id) {
      return { ok: false as const, message: JOIN_NOT_FOUND };
    }

    await tx.$queryRaw`SELECT 1 FROM sparring_offers WHERE id = ${join.offerId}::uuid FOR UPDATE`;
    // Read again under the lock: the state that the decision is based on.
    const offer = await tx.sparringOffer.findUniqueOrThrow({
      where: { id: join.offerId },
      select: {
        status: true,
        format: true,
        hasPartner: true,
        startsAt: true,
        joins: { where: { id: id.data }, select: { status: true } },
        _count: { select: { joins: { where: { status: "ACCEPTED" } } } },
      },
    });
    const joinStatus = offer.joins.at(0)?.status;
    const acceptedCount = offer._count.joins;
    const next = joinStatus && nextJoinStatus(action, joinStatus);
    const now = new Date();
    const refusal = joinStatus
      ? joinChangeRefusal({
          action,
          joinStatus,
          offer,
          acceptedCount,
          now,
        })
      : "NOT_ALLOWED";
    if (refusal || !next) {
      return {
        ok: false as const,
        message: CHANGE_REFUSAL_MESSAGES[refusal ?? "NOT_ALLOWED"],
      };
    }

    await tx.offerJoin.update({
      where: { id: id.data },
      data: { status: next },
    });

    // Reliability (decision 2026-10-14): a player withdrawing an already-
    // accepted place late counts against them, same rule cancelOffer (3.14)
    // applies to the author; a singles join reaching ACCEPTED is a newly
    // scheduled match for both sides (4.11-4.12).
    if (
      action === "WITHDRAW" &&
      joinStatus === "ACCEPTED" &&
      isLateCancellation(offer.startsAt, now)
    ) {
      await recordLateCancellation(tx, join.userId);
    }
    if (next === "ACCEPTED" && offer.format === "SINGLES") {
      await recordScheduledMatch(tx, [join.offer.authorId, join.userId]);
    }

    const acceptedAfter =
      acceptedCount +
      (next === "ACCEPTED" ? 1 : 0) -
      (joinStatus === "ACCEPTED" ? 1 : 0);
    const offerStatus = offerStatusFor(offer, acceptedAfter);
    if (offerStatus !== offer.status) {
      await tx.sparringOffer.update({
        where: { id: join.offerId },
        data: { status: offerStatus },
      });
    }
    return { ok: true as const, offerId: join.offerId, playerId: join.userId };
  });

  if (!result.ok) {
    return result;
  }
  // Task 5.16: "accepted"/"declined", to the player — never on WITHDRAW,
  // which is the player's own action and needs no notice back to them.
  if (action === "ACCEPT" || action === "DECLINE") {
    await notify(result.playerId, {
      kind: action === "ACCEPT" ? "JOIN_ACCEPTED" : "JOIN_DECLINED",
      offerId: result.offerId,
    });
  }
  // The offer's page and the feed's free places both change.
  revalidatePath(`/offers/${result.offerId}`);
  revalidatePath("/offers");
  return { ok: true };
}

/**
 * The author cancels their offer (3.14). Joins keep their status, so accepted
 * players still find it among their games and see it cancelled. The offer row
 * is locked like in changeJoin: an "accept" racing the cancel runs before or
 * after it, never on a half-cancelled offer. Cancelling less than 12h before
 * the start with players already in flags a late cancellation (decision
 * 2026-10-14) — the counter itself is session 05, this just marks the moment.
 */
export async function cancelOffer(offerId: unknown): Promise<JoinChangeResult> {
  const author = await requireOnboardedUser();

  const id = z.uuid().safeParse(offerId);
  if (!id.success) {
    return { ok: false, message: NOT_FOUND };
  }

  const result = await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT 1 FROM sparring_offers WHERE id = ${id.data}::uuid FOR UPDATE`;
    // The author is part of the lookup: someone else's offer looks missing.
    const offer = await tx.sparringOffer.findFirst({
      where: { id: id.data, authorId: author.id },
      select: {
        status: true,
        startsAt: true,
        _count: { select: { joins: { where: { status: "ACCEPTED" } } } },
      },
    });
    if (!offer) {
      return { ok: false as const, message: NOT_FOUND };
    }
    const now = new Date();
    if (!canCancelOffer(offer, now)) {
      return {
        ok: false as const,
        message:
          offer.status === "CANCELLED"
            ? "This offer is already cancelled."
            : "This game has already started.",
      };
    }
    await tx.sparringOffer.update({
      where: { id: id.data },
      data: { status: "CANCELLED" },
    });
    if (offer._count.joins > 0 && isLateCancellation(offer.startsAt, now)) {
      await recordLateCancellation(tx, author.id);
    }
    return { ok: true as const };
  });

  if (!result.ok) {
    return result;
  }
  revalidatePath(`/offers/${id.data}`);
  revalidatePath("/offers");
  return { ok: true };
}

/**
 * The author marks the court as booked (task 2.13), after clicking through
 * to the club's booking link or phone number. One click sets courtStatus and
 * tells every player with a live request or place, the same welcome note
 * (requestToJoin) and result notices (result-actions.ts) already do.
 */
export async function markCourtBooked(
  offerId: unknown,
): Promise<JoinChangeResult> {
  const author = await requireOnboardedUser();

  const id = z.uuid().safeParse(offerId);
  if (!id.success) {
    return { ok: false, message: NOT_FOUND };
  }

  const offer = await db.sparringOffer.findFirst({
    where: { id: id.data, authorId: author.id },
    select: { courtStatus: true },
  });
  if (!offer) {
    return { ok: false, message: NOT_FOUND };
  }
  if (offer.courtStatus === "BOOKED") {
    return { ok: true };
  }

  const activeJoins = await db.offerJoin.findMany({
    where: { offerId: id.data, status: { in: ["REQUESTED", "ACCEPTED"] } },
    select: { id: true, userId: true },
  });
  await db.sparringOffer.update({
    where: { id: id.data },
    data: { courtStatus: "BOOKED" },
  });
  // Task 5.16: "court booked", to the same players the system message goes
  // to — whoever has a live request or place on this offer.
  await Promise.all(
    activeJoins.map((join) =>
      notify(join.userId, { kind: "COURT_BOOKED", offerId: id.data }),
    ),
  );
  await Promise.all(
    activeJoins.map((join) =>
      postSystemMessage({ offerJoinId: join.id }, COURT_BOOKED_MESSAGE),
    ),
  );

  revalidatePath(`/offers/${id.data}`);
  return { ok: true };
}
