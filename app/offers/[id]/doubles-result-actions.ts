"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";

import type { JoinChangeResult } from "@/app/offers/[id]/actions";
import { captureEvent } from "@/lib/analytics/posthog";
import { requireOnboardedUser } from "@/lib/auth/require-onboarded-user";
import { db } from "@/lib/db";
import { submitDoublesFeedback } from "@/lib/feedback/match-feedback";
import {
  isValidNoShowTarget,
  resolveDoublesPairs,
  settleDoublesRefusal,
  submitDoublesRefusal,
  type DoublesGame,
  type SubmitDoublesRefusal,
} from "@/lib/offers/doubles-result-rules";
import {
  lockDoublesResult,
  settleDoublesResult,
} from "@/lib/rating/apply-doubles";
import { notifyDoublesSettlers } from "@/lib/rating/doubles-cron";
import { matchFeedbackSchema } from "@/lib/validation/match-feedback";
import { matchScoreSchema } from "@/lib/validation/match-result";

// A doubles game's result on /offers/[id] (slice PD4, decision 2026-11-24):
// file a score (with who played with the author) or a no-show, and the
// other pair confirms or disputes it. Padel and tennis doubles alike; only
// a padel result moves a rating (lib/rating/apply-doubles.ts). The rules
// are lib/offers/doubles-result-rules.ts; these only load rows and act.

const RESULT_HOURS_TO_AUTO_CONFIRM = 72;

const partnerSchema = z.object({ authorPartnerId: z.uuid().nullable() });

async function loadGame(offerId: string) {
  const offer = await db.sparringOffer.findUnique({
    where: { id: offerId },
    select: {
      authorId: true,
      format: true,
      status: true,
      hasPartner: true,
      startsAt: true,
      joins: { where: { status: "ACCEPTED" }, select: { userId: true } },
      doublesResult: { select: { id: true } },
    },
  });
  if (!offer) {
    return null;
  }
  const game: DoublesGame = {
    ...offer,
    acceptedIds: offer.joins.map((join) => join.userId),
  };
  return { game, hasExistingResult: offer.doublesResult !== null };
}

type Loaded =
  | { ok: true; game: DoublesGame; offerId: string }
  | { ok: false; message: string };

async function loadSubmittableGame(
  offerId: unknown,
  userId: string,
): Promise<Loaded> {
  const t = await getTranslations("Errors");
  const tRefusal = await getTranslations("DoublesResultRefusal");
  const id = z.uuid().safeParse(offerId);
  const loaded = id.success ? await loadGame(id.data) : null;
  if (!id.success || !loaded) {
    return { ok: false, message: t("matchNotFound") };
  }
  const refusal = submitDoublesRefusal({
    game: loaded.game,
    userId,
    hasExistingResult: loaded.hasExistingResult,
    now: new Date(),
  });
  if (refusal) {
    return { ok: false, message: tRefusal(refusal) };
  }
  return { ok: true, game: loaded.game, offerId: id.data };
}

async function createResult(
  offerId: string,
  data: {
    reportedById: string;
    authorPartnerId?: string | null;
    opponent1Id?: string;
    opponent2Id?: string;
    score?: { author: number; player: number }[];
    winner?: "AUTHOR" | "PLAYER";
    noShowUserId?: string;
  },
) {
  return (
    await db.doublesResult.createManyAndReturn({
      data: [
        {
          offerId,
          ...data,
          autoConfirmAt: new Date(
            Date.now() + RESULT_HOURS_TO_AUTO_CONFIRM * 3_600_000,
          ),
        },
      ],
      select: {
        offerId: true,
        authorPartnerId: true,
        opponent1Id: true,
        opponent2Id: true,
        reportedById: true,
        noShowUserId: true,
      },
      // The offer's unique result: a second filing racing this one loses.
      skipDuplicates: true,
    })
  ).at(0);
}

/** Files a doubles score: who played with the author, and the sets. */
export async function submitDoublesResult(
  offerId: unknown,
  input: unknown,
): Promise<JoinChangeResult> {
  const user = await requireOnboardedUser();
  const t = await getTranslations("Errors");
  const tRefusal = await getTranslations("DoublesResultRefusal");
  const tMatchResult = await getTranslations("Validation.matchResult");

  const score = matchScoreSchema(tMatchResult).safeParse(input);
  if (!score.success) {
    return {
      ok: false,
      message: score.error.issues[0]?.message ?? t("checkTheScore"),
    };
  }
  const partner = partnerSchema.safeParse(input);
  if (!partner.success) {
    return { ok: false, message: tRefusal("BAD_PAIRS") };
  }

  const loaded = await loadSubmittableGame(offerId, user.id);
  if (!loaded.ok) {
    return loaded;
  }
  const pairs = resolveDoublesPairs(loaded.game, partner.data.authorPartnerId);
  if (!pairs) {
    return { ok: false, message: tRefusal("BAD_PAIRS") };
  }

  const created = await createResult(loaded.offerId, {
    reportedById: user.id,
    ...pairs,
    score: score.data.sets,
    winner: score.data.winner,
  });
  if (!created) {
    return { ok: false, message: tRefusal("ALREADY_SUBMITTED") };
  }

  await notifyDoublesSettlers({ ...created, authorId: loaded.game.authorId });
  revalidatePath(`/offers/${loaded.offerId}`);
  return { ok: true };
}

/** Reports that one player of the game didn't come. */
export async function submitDoublesNoShow(
  offerId: unknown,
  noShowUserId: unknown,
): Promise<JoinChangeResult> {
  const user = await requireOnboardedUser();
  const tRefusal = await getTranslations("DoublesResultRefusal");

  const loaded = await loadSubmittableGame(offerId, user.id);
  if (!loaded.ok) {
    return loaded;
  }
  const target = z.uuid().safeParse(noShowUserId);
  if (
    !target.success ||
    !isValidNoShowTarget(loaded.game, user.id, target.data)
  ) {
    return {
      ok: false,
      message: tRefusal("BAD_NO_SHOW" satisfies SubmitDoublesRefusal),
    };
  }

  const created = await createResult(loaded.offerId, {
    reportedById: user.id,
    noShowUserId: target.data,
  });
  if (!created) {
    return { ok: false, message: tRefusal("ALREADY_SUBMITTED") };
  }

  await notifyDoublesSettlers({ ...created, authorId: loaded.game.authorId });
  await captureEvent("no_show_reported", user.id, {});
  revalidatePath(`/offers/${loaded.offerId}`);
  return { ok: true };
}

// Confirm and dispute share one path, like the singles settleResult: lock
// the row, check the viewer may act and it's still PENDING, then act.
async function settle(
  resultId: unknown,
  action: "CONFIRM" | "DISPUTE",
): Promise<JoinChangeResult> {
  const user = await requireOnboardedUser();
  const t = await getTranslations("Errors");
  const tRefusal = await getTranslations("DoublesResultRefusal");

  const id = z.uuid().safeParse(resultId);
  if (!id.success) {
    return { ok: false, message: t("resultNotFound") };
  }

  const outcome = await db.$transaction(async (tx) => {
    const result = await lockDoublesResult(tx, id.data);
    if (!result) {
      return { ok: false as const, message: t("resultNotFound") };
    }
    const refusal = settleDoublesRefusal({
      result: { ...result, authorId: result.offer.authorId },
      userId: user.id,
    });
    if (refusal) {
      return { ok: false as const, message: tRefusal(refusal) };
    }
    // A no-show report has nothing to confirm by hand: only a dispute or
    // the 72h deadline settles it (decision 2026-10-14).
    if (action === "CONFIRM" && result.noShowUserId) {
      return { ok: false as const, message: t("noShowManualConfirmRefused") };
    }
    if (action === "CONFIRM") {
      await settleDoublesResult(tx, result);
    } else {
      await tx.doublesResult.update({
        where: { id: id.data },
        data: { status: "DISPUTED" },
      });
    }
    return { ok: true as const, offerId: result.offer.id };
  });
  if (!outcome.ok) {
    return outcome;
  }

  if (action === "CONFIRM") {
    await captureEvent("result_confirmed", user.id, {});
  }
  revalidatePath(`/offers/${outcome.offerId}`);
  return { ok: true };
}

/** Someone in the other pair confirms a filed score. */
export async function confirmDoublesResult(
  resultId: unknown,
): Promise<JoinChangeResult> {
  return settle(resultId, "CONFIRM");
}

/** The other pair disputes a score, or the named player a no-show report. */
export async function disputeDoublesResult(
  resultId: unknown,
): Promise<JoinChangeResult> {
  return settle(resultId, "DISPUTE");
}

/**
 * Rates one other player after a confirmed doubles result (PD4.5). Tags
 * only — any level signal sent along is ignored (match-feedback.ts says why).
 */
export async function rateDoublesPlayer(
  resultId: unknown,
  receiverId: unknown,
  input: unknown,
): Promise<JoinChangeResult> {
  const user = await requireOnboardedUser();
  const tErrors = await getTranslations("Errors");
  const tRefusal = await getTranslations("SubmitFeedbackRefusal");

  const id = z.uuid().safeParse(resultId);
  const receiver = z.uuid().safeParse(receiverId);
  const parsed = matchFeedbackSchema.safeParse(input);
  if (!id.success || !receiver.success || !parsed.success) {
    return { ok: false, message: tErrors("invalidRequest") };
  }

  const outcome = await submitDoublesFeedback(
    id.data,
    user.id,
    receiver.data,
    parsed.data.tags,
  );
  if (!outcome.ok) {
    return { ok: false, message: tRefusal(outcome.refusal) };
  }
  await captureEvent("feedback_given", user.id, {
    count: parsed.data.tags.length,
  });
  return { ok: true };
}
