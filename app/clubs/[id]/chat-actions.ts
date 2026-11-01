"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";

import { captureEvent } from "@/lib/analytics/posthog";
import { requireOnboardedUser } from "@/lib/auth/require-onboarded-user";
import { db } from "@/lib/db";
import { canWriteToClubThread } from "@/lib/messages/thread-rules";
import { blockedRefusal } from "@/lib/moderation/block-rules";
import {
  createReport,
  type CreateReportResult,
} from "@/lib/moderation/create-report";
import { checkRateLimit } from "@/lib/rate-limit/check-rate-limit";
import { reportInputSchema } from "@/lib/validation/report";
import { messageContentSchema } from "@/lib/validation/message";

export type SendClubMessageResult =
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

// "Send" in a club's chat (task O.11): the same chain sendMessage
// (app/offers/[id]/actions.ts) uses for a join's thread, with a follower
// check (lib/messages/thread-rules.ts) in place of isJoinThreadParticipant.
// No notify() call — club chat ships without notifications (out of scope,
// docs/TIER2-FEATURES.md: notify() requires an offerId, which a club
// message doesn't have).
export async function sendClubMessage(
  clubId: unknown,
  content: unknown,
): Promise<SendClubMessageResult> {
  const user = await requireOnboardedUser();
  const tErrors = await getTranslations("Errors");

  const blocked = blockedRefusal(tErrors, user);
  if (blocked) {
    return { ok: false, message: blocked };
  }

  const id = z.uuid().safeParse(clubId);
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

  const follow = await db.clubFollow.findUnique({
    where: { userId_clubId: { userId: user.id, clubId: id.data } },
    select: { id: true },
  });
  // Someone else's thread looks the same as a missing one (sendMessage's
  // own convention).
  if (!canWriteToClubThread(follow !== null, user)) {
    return { ok: false, message: tErrors("threadNotFound") };
  }

  const message = await db.message.create({
    data: { clubId: id.data, senderId: user.id, content: text.data },
    select: { id: true, content: true, senderId: true, createdAt: true },
  });
  await captureEvent("club_message_sent", user.id, {});

  revalidatePath(`/clubs/${id.data}/chat`);
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

// "Report" beside a message in a club's chat (task O.11), mirroring
// reportMessage (app/offers/[id]/report-actions.ts): the message must
// belong to this club, be TEXT (never a SYSTEM note), and the reporter must
// be a follower.
export async function reportClubMessage(
  clubId: unknown,
  messageId: unknown,
  input: unknown,
): Promise<CreateReportResult> {
  const reporter = await requireOnboardedUser();
  const t = await getTranslations("Errors");
  const tRateLimit = await getTranslations("RateLimit");
  const tReport = await getTranslations("Validation.report");

  const id = z.uuid().safeParse(clubId);
  const msgId = z.uuid().safeParse(messageId);
  if (!id.success || !msgId.success) {
    return { ok: false, message: t("threadNotFound") };
  }
  const parsed = reportInputSchema(tReport).safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? t("checkTheForm"),
    };
  }

  const follow = await db.clubFollow.findUnique({
    where: { userId_clubId: { userId: reporter.id, clubId: id.data } },
    select: { id: true },
  });
  if (!follow) {
    return { ok: false, message: t("threadNotFound") };
  }

  const message = await db.message.findUnique({
    where: { id: msgId.data },
    select: { clubId: true, type: true, senderId: true },
  });
  if (
    !message ||
    message.clubId !== id.data ||
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
