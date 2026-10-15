"use server";

import { getTranslations } from "next-intl/server";
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

export async function reportOffer(
  offerId: unknown,
  input: unknown,
): Promise<CreateReportResult> {
  const reporter = await requireOnboardedUser();
  const t = await getTranslations("Errors");
  const tRateLimit = await getTranslations("RateLimit");
  const tReport = await getTranslations("Validation.report");

  const id = z.uuid().safeParse(offerId);
  if (!id.success) {
    return { ok: false, message: t("offerNotFound") };
  }
  const parsed = reportInputSchema(tReport).safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? t("checkTheForm"),
    };
  }

  const offer = await db.sparringOffer.findUnique({
    where: { id: id.data },
    select: { authorId: true },
  });
  if (!offer) {
    return { ok: false, message: t("offerNotFound") };
  }

  return createReport({
    t,
    tRateLimit,
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
  const t = await getTranslations("Errors");
  const tRateLimit = await getTranslations("RateLimit");
  const tReport = await getTranslations("Validation.report");

  const joinId = z.uuid().safeParse(offerJoinId);
  const msgId = z.uuid().safeParse(messageId);
  if (!joinId.success || !msgId.success) {
    return { ok: false, message: t("threadNotFound") };
  }
  const parsed = reportInputSchema(tReport).safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? t("checkTheForm"),
    };
  }

  const join = await db.offerJoin.findUnique({
    where: { id: joinId.data },
    select: { userId: true, offer: { select: { authorId: true } } },
  });
  // Someone else's thread looks the same as a missing one (sendMessage's
  // own convention, app/offers/[id]/actions.ts).
  if (!join || !isJoinThreadParticipant(join, reporter.id)) {
    return { ok: false, message: t("threadNotFound") };
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
    return { ok: false, message: t("messageNotFound") };
  }

  return createReport({
    t,
    tRateLimit,
    reporterId: reporter.id,
    targetUserId: message.senderId,
    messageId: msgId.data,
    input: parsed.data,
  });
}
