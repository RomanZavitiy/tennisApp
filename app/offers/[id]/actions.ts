"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireOnboardedUser } from "@/lib/auth/require-onboarded-user";
import { db } from "@/lib/db";
import { JOIN_REFUSAL_MESSAGES, joinRefusal } from "@/lib/offers/join-rules";

export type RequestToJoinResult = { ok: true } | { ok: false; message: string };

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
