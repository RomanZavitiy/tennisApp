"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";

import { captureEvent } from "@/lib/analytics/posthog";
import { requireOnboardedUser } from "@/lib/auth/require-onboarded-user";
import { db } from "@/lib/db";
import {
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
import { joinRefusal } from "@/lib/offers/join-rules";
import {
  ACTION_ACTOR,
  joinChangeRefusal,
  nextJoinStatus,
  offerStatusFor,
  type JoinAction,
  type JoinChangeRefusal,
} from "@/lib/offers/join-transitions";
import { markOfferCourtBooked } from "@/lib/offers/mark-court-booked";
import { checkRateLimit } from "@/lib/rate-limit/check-rate-limit";
import {
  isLateCancellation,
  recordLateCancellation,
  recordScheduledMatch,
} from "@/lib/rating/reliability";
import { messageContentSchema } from "@/lib/validation/message";

export type RequestToJoinResult = { ok: true } | { ok: false; message: string };
export type JoinChangeResult = RequestToJoinResult;

// "Ask to join" on /offers/[id] (the page comes in 3.13). The player is the
// signed-in one with a finished profile — never an id from the request — and
// the answer carries no details of either side: contact happens in the
// join's private thread (3.1), never by phone or email.
export async function requestToJoin(
  offerId: unknown,
): Promise<RequestToJoinResult> {
  const player = await requireOnboardedUser();
  const tErrors = await getTranslations("Errors");

  const blocked = blockedRefusal(tErrors, player);
  if (blocked) {
    return { ok: false, message: blocked };
  }

  const id = z.uuid().safeParse(offerId);
  if (!id.success) {
    return { ok: false, message: tErrors("offerNotFound") };
  }
  const limited = await checkRateLimit(player.id, "JOIN_REQUEST");
  if (!limited.ok) {
    const tRateLimit = await getTranslations("RateLimit");
    return { ok: false, message: tRateLimit("JOIN_REQUEST") };
  }

  const offer = await db.sparringOffer.findUnique({
    where: { id: id.data },
    select: { authorId: true, status: true, startsAt: true, format: true },
  });
  if (!offer) {
    return { ok: false, message: tErrors("offerNotFound") };
  }
  const existing = await db.offerJoin.findUnique({
    where: { offerId_userId: { offerId: id.data, userId: player.id } },
    select: { id: true, status: true },
  });

  const tJoinRefusal = await getTranslations("JoinRefusal");
  const refusal = joinRefusal({
    offer,
    playerId: player.id,
    existing,
    now: new Date(),
  });
  if (refusal) {
    return { ok: false, message: tJoinRefusal(refusal) };
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
      return { ok: false, message: tJoinRefusal("ALREADY_REQUESTED") };
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
      return { ok: false, message: tJoinRefusal("ALREADY_REQUESTED") };
    }
    await postSystemMessage(
      { offerJoinId: created.id },
      THREAD_WELCOME_MESSAGE,
    );
  }

  // Task 5.16: "new join request", to the author — on a reopened request
  // too, since it's a fresh ask either way.
  await notify(offer.authorId, { kind: "JOIN_REQUESTED", offerId: id.data });
  await captureEvent("join_requested", player.id, { format: offer.format });

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
  const tErrors = await getTranslations("Errors");

  const blocked = blockedRefusal(tErrors, user);
  if (blocked) {
    return { ok: false, message: blocked };
  }

  const id = z.uuid().safeParse(offerJoinId);
  if (!id.success) {
    return { ok: false, message: tErrors("threadNotFound") };
  }
  const tMessage = await getTranslations("Validation.message");
  const text = messageContentSchema(tMessage).safeParse(content);
  if (!text.success) {
    return {
      ok: false,
      message: text.error.issues[0]?.message ?? tErrors("threadNotFound"),
    };
  }
  const limited = await checkRateLimit(user.id, "MESSAGE");
  if (!limited.ok) {
    const tRateLimit = await getTranslations("RateLimit");
    return { ok: false, message: tRateLimit("MESSAGE") };
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
    return { ok: false, message: tErrors("threadNotFound") };
  }
  if (!canWriteToThread(join, join.offer, new Date())) {
    return { ok: false, message: tErrors("threadReadOnly") };
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
  await captureEvent("message_sent", user.id, {});

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
  const tErrors = await getTranslations("Errors");
  const tChangeRefusal = await getTranslations("JoinChangeRefusal");

  const id = z.uuid().safeParse(joinId);
  if (!id.success) {
    return { ok: false, message: tErrors("joinNotFound") };
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
      return { ok: false as const, message: tErrors("joinNotFound") };
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
    const refusal: JoinChangeRefusal | "NOT_ALLOWED" | null = joinStatus
      ? joinChangeRefusal({ action, joinStatus, offer, acceptedCount, now })
      : "NOT_ALLOWED";
    if (refusal || !next) {
      return {
        ok: false as const,
        message: tChangeRefusal(refusal ?? "NOT_ALLOWED"),
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
    return {
      ok: true as const,
      offerId: join.offerId,
      playerId: join.userId,
      format: offer.format,
    };
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
  if (action === "ACCEPT") {
    await captureEvent("join_accepted", result.playerId, {
      format: result.format,
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
  const tErrors = await getTranslations("Errors");

  const id = z.uuid().safeParse(offerId);
  if (!id.success) {
    return { ok: false, message: tErrors("offerNotFound") };
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
      return { ok: false as const, message: tErrors("offerNotFound") };
    }
    const now = new Date();
    if (!canCancelOffer(offer, now)) {
      return {
        ok: false as const,
        message:
          offer.status === "CANCELLED"
            ? tErrors("alreadyCancelled")
            : tErrors("alreadyStarted"),
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
  const tErrors = await getTranslations("Errors");

  const id = z.uuid().safeParse(offerId);
  if (!id.success) {
    return { ok: false, message: tErrors("offerNotFound") };
  }

  const offer = await db.sparringOffer.findFirst({
    where: { id: id.data, authorId: author.id },
    select: { courtStatus: true },
  });
  if (!offer) {
    return { ok: false, message: tErrors("offerNotFound") };
  }
  if (offer.courtStatus === "BOOKED") {
    return { ok: true };
  }

  await markOfferCourtBooked(id.data, author.id);

  revalidatePath(`/offers/${id.data}`);
  return { ok: true };
}
