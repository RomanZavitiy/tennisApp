"use server";

import { z } from "zod";

import { requireOnboardedUser } from "@/lib/auth/require-onboarded-user";
import { db } from "@/lib/db";
import { isJoinThreadParticipant } from "@/lib/messages/thread-rules";
import {
  createReport,
  type CreateReportResult,
} from "@/lib/moderation/create-report";
import { reportInputSchema } from "@/lib/validation/report";

// "Report" on an offer's page, and beside a message in a join's thread
// (task 3.19). Both resolve their target's user id server-side (the offer's
// author, the message's sender) — never from the client — and reuse
// createReport for the rest (duplicate check, rate limit, autoblock).

const OFFER_NOT_FOUND = "This offer doesn't exist.";
const THREAD_NOT_FOUND = "This conversation doesn't exist.";
const MESSAGE_NOT_FOUND = "This message doesn't exist.";
const CHECK_THE_FORM = "Check the form.";

export async function reportOffer(
  offerId: unknown,
  input: unknown,
): Promise<CreateReportResult> {
  const reporter = await requireOnboardedUser();

  const id = z.uuid().safeParse(offerId);
  if (!id.success) {
    return { ok: false, message: OFFER_NOT_FOUND };
  }
  const parsed = reportInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? CHECK_THE_FORM,
    };
  }

  const offer = await db.sparringOffer.findUnique({
    where: { id: id.data },
    select: { authorId: true },
  });
  if (!offer) {
    return { ok: false, message: OFFER_NOT_FOUND };
  }

  return createReport({
    reporterId: reporter.id,
    targetUserId: offer.authorId,
    offerId: id.data,
    input: parsed.data,
  });
}

export async function reportMessage(
  offerJoinId: unknown,
  messageId: unknown,
  input: unknown,
): Promise<CreateReportResult> {
  const reporter = await requireOnboardedUser();

  const joinId = z.uuid().safeParse(offerJoinId);
  const msgId = z.uuid().safeParse(messageId);
  if (!joinId.success || !msgId.success) {
    return { ok: false, message: THREAD_NOT_FOUND };
  }
  const parsed = reportInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? CHECK_THE_FORM,
    };
  }

  const join = await db.offerJoin.findUnique({
    where: { id: joinId.data },
    select: { userId: true, offer: { select: { authorId: true } } },
  });
  // Someone else's thread looks the same as a missing one (sendMessage's
  // own convention, app/offers/[id]/actions.ts).
  if (!join || !isJoinThreadParticipant(join, reporter.id)) {
    return { ok: false, message: THREAD_NOT_FOUND };
  }

  const message = await db.message.findUnique({
    where: { id: msgId.data },
    select: { offerJoinId: true, type: true, senderId: true },
  });
  if (
    !message ||
    message.offerJoinId !== joinId.data ||
    message.type !== "TEXT" ||
    !message.senderId
  ) {
    return { ok: false, message: MESSAGE_NOT_FOUND };
  }

  return createReport({
    reporterId: reporter.id,
    targetUserId: message.senderId,
    messageId: msgId.data,
    input: parsed.data,
  });
}
