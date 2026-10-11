"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireOnboardedUser } from "@/lib/auth/require-onboarded-user";
import { db } from "@/lib/db";
import { JOIN_REFUSAL_MESSAGES, joinRefusal } from "@/lib/offers/join-rules";
import {
  ACTION_ACTOR,
  joinChangeRefusal,
  nextJoinStatus,
  offerStatusFor,
  type JoinAction,
  type JoinChangeRefusal,
} from "@/lib/offers/join-transitions";

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

  const id = z.uuid().safeParse(offerId);
  if (!id.success) {
    return { ok: false, message: NOT_FOUND };
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
  // still be WITHDRAWN.
  const { count } = existing
    ? await db.offerJoin.updateMany({
        where: { id: existing.id, status: "WITHDRAWN" },
        data: { status: "REQUESTED" },
      })
    : await db.offerJoin.createMany({
        data: [{ offerId: id.data, userId: player.id }],
        skipDuplicates: true,
      });
  if (count === 0) {
    return { ok: false, message: JOIN_REFUSAL_MESSAGES.ALREADY_REQUESTED };
  }

  revalidatePath(`/offers/${id.data}`);
  return { ok: true };
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
    const refusal = joinStatus
      ? joinChangeRefusal({
          action,
          joinStatus,
          offer,
          acceptedCount,
          now: new Date(),
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
    return { ok: true as const, offerId: join.offerId };
  });

  if (!result.ok) {
    return result;
  }
  // The offer's page and the feed's free places both change.
  revalidatePath(`/offers/${result.offerId}`);
  revalidatePath("/offers");
  return { ok: true };
}
