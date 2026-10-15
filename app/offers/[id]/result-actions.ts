"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { JoinChangeResult } from "@/app/offers/[id]/actions";
import { requireOnboardedUser } from "@/lib/auth/require-onboarded-user";
import { db } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import type { MatchParty } from "@/lib/generated/prisma/enums";
import {
  postSystemMessage,
  RESULT_CONFIRMED_MESSAGE,
  RESULT_DISPUTED_MESSAGE,
  RESULT_NO_SHOW_REPORTED_MESSAGE,
  RESULT_SUBMITTED_MESSAGE,
} from "@/lib/messages/post-system-message";
import {
  partyOf,
  SETTLE_RESULT_REFUSAL_MESSAGES,
  settleResultRefusal,
  SUBMIT_RESULT_REFUSAL_MESSAGES,
  submitResultRefusal,
} from "@/lib/offers/result-rules";
import { applyMatchEloFromJoin } from "@/lib/rating/apply-elo";
import { matchScoreSchema } from "@/lib/validation/match-result";

const RESULT_HOURS_TO_AUTO_CONFIRM = 72;
const JOIN_NOT_FOUND = "This match doesn't exist.";
const RESULT_NOT_FOUND = "This result doesn't exist.";
const NO_SHOW_MANUAL_CONFIRM_REFUSED =
  "A no-show report isn't confirmed manually — dispute it, or leave it to settle on its own after 72 hours.";

// What submitResult (4.6) and submitNoShow (4.10) both need before filing
// either kind of report for a join: whether the filer is a party to a
// singles match that's accepted, started, and doesn't have a result yet.
async function loadSubmittableJoin(offerJoinId: string, userId: string) {
  const join = await db.offerJoin.findUnique({
    where: { id: offerJoinId },
    select: {
      userId: true,
      status: true,
      offerId: true,
      offer: { select: { authorId: true, format: true, startsAt: true } },
      result: { select: { id: true } },
    },
  });
  if (!join) {
    return { ok: false as const, message: JOIN_NOT_FOUND };
  }

  const party = partyOf(join, userId);
  const refusal = submitResultRefusal({
    party,
    joinStatus: join.status,
    offerFormat: join.offer.format,
    startsAt: join.offer.startsAt,
    hasExistingResult: join.result !== null,
    now: new Date(),
  });
  if (refusal || !party) {
    return {
      ok: false as const,
      message: SUBMIT_RESULT_REFUSAL_MESSAGES[refusal ?? "NOT_PARTICIPANT"],
    };
  }
  return { ok: true as const, join, party };
}

// "Submit a result" on /offers/[id] (task 4.6): only a participant of the
// join, only for a singles match that has been accepted and has started,
// and only once — a second submission for the same join is refused, same
// style as requestToJoin's skipDuplicates (3.11). The score is checked
// again server-side (matchScoreSchema, 4.5) even though the form (4.6)
// already checked it in the browser.
export async function submitResult(
  offerJoinId: unknown,
  input: unknown,
): Promise<JoinChangeResult> {
  const user = await requireOnboardedUser();

  const id = z.uuid().safeParse(offerJoinId);
  if (!id.success) {
    return { ok: false, message: JOIN_NOT_FOUND };
  }
  const score = matchScoreSchema.safeParse(input);
  if (!score.success) {
    return {
      ok: false,
      message: score.error.issues[0]?.message ?? "Check the score.",
    };
  }

  const loaded = await loadSubmittableJoin(id.data, user.id);
  if (!loaded.ok) {
    return loaded;
  }
  const { join, party } = loaded;

  const created = (
    await db.matchResult.createManyAndReturn({
      data: [
        {
          offerJoinId: id.data,
          score: score.data.sets,
          winner: score.data.winner,
          reportedBy: party,
          autoConfirmAt: new Date(
            Date.now() + RESULT_HOURS_TO_AUTO_CONFIRM * 3_600_000,
          ),
        },
      ],
      select: { id: true },
      skipDuplicates: true,
    })
  ).at(0);
  if (!created) {
    return {
      ok: false,
      message: SUBMIT_RESULT_REFUSAL_MESSAGES.ALREADY_SUBMITTED,
    };
  }

  await postSystemMessage({ offerJoinId: id.data }, RESULT_SUBMITTED_MESSAGE);
  revalidatePath(`/offers/${join.offerId}`);
  return { ok: true };
}

// "Opponent didn't show up" on /offers/[id] (task 4.10): the same who-may-
// file rule as a score (loadSubmittableJoin), but files a no-show report
// instead — no score, no winner. noShowParty is the other side of whoever
// files it: you report that your opponent didn't show up, never yourself.
export async function submitNoShow(
  offerJoinId: unknown,
): Promise<JoinChangeResult> {
  const user = await requireOnboardedUser();

  const id = z.uuid().safeParse(offerJoinId);
  if (!id.success) {
    return { ok: false, message: JOIN_NOT_FOUND };
  }

  const loaded = await loadSubmittableJoin(id.data, user.id);
  if (!loaded.ok) {
    return loaded;
  }
  const { join, party } = loaded;
  const noShowParty: MatchParty = party === "AUTHOR" ? "PLAYER" : "AUTHOR";

  const created = (
    await db.matchResult.createManyAndReturn({
      data: [
        {
          offerJoinId: id.data,
          noShowParty,
          reportedBy: party,
          autoConfirmAt: new Date(
            Date.now() + RESULT_HOURS_TO_AUTO_CONFIRM * 3_600_000,
          ),
        },
      ],
      select: { id: true },
      skipDuplicates: true,
    })
  ).at(0);
  if (!created) {
    return {
      ok: false,
      message: SUBMIT_RESULT_REFUSAL_MESSAGES.ALREADY_SUBMITTED,
    };
  }

  await postSystemMessage(
    { offerJoinId: id.data },
    RESULT_NO_SHOW_REPORTED_MESSAGE,
  );
  revalidatePath(`/offers/${join.offerId}`);
  return { ok: true };
}

type SettleOutcome =
  | { ok: true; offerId: string; offerJoinId: string }
  | { ok: false; message: string };

// One path for confirm and dispute (4.7, extended by 4.10 for a no-show
// report): both are "the other party settles a still-pending result", only
// what they set it to — and whether they even may — differs. The row is
// locked first, like changeJoin (3.12) locks the offer — so a confirm
// racing another confirm (the "double confirmation" test) or a dispute runs
// one after the other, and the second one always sees a result that's no
// longer PENDING.
type PendingResult = {
  winner: MatchParty | null;
  noShowParty: MatchParty | null;
  offerJoin: {
    id: string;
    offerId: string;
    userId: string;
    offer: {
      authorId: string;
      author: { elo: number | null; matchesPlayed: number };
    };
    user: { elo: number | null; matchesPlayed: number };
  };
};

type SettleAction = (
  tx: Prisma.TransactionClient,
  resultId: string,
  result: PendingResult,
) => Promise<{ ok: true } | { ok: false; message: string }>;

async function settleResult(
  matchResultId: unknown,
  userId: string,
  onPending: SettleAction,
): Promise<SettleOutcome> {
  const id = z.uuid().safeParse(matchResultId);
  if (!id.success) {
    return { ok: false, message: RESULT_NOT_FOUND };
  }

  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT 1 FROM match_results WHERE id = ${id.data}::uuid FOR UPDATE`;
    const result = await tx.matchResult.findUnique({
      where: { id: id.data },
      select: {
        status: true,
        winner: true,
        reportedBy: true,
        noShowParty: true,
        offerJoin: {
          select: {
            id: true,
            offerId: true,
            userId: true,
            offer: {
              select: {
                authorId: true,
                author: { select: { elo: true, matchesPlayed: true } },
              },
            },
            user: { select: { elo: true, matchesPlayed: true } },
          },
        },
      },
    });
    const join = result?.offerJoin;
    if (!result || !join) {
      return { ok: false, message: RESULT_NOT_FOUND };
    }

    const party = partyOf(join, userId);
    const refusal = settleResultRefusal({
      party,
      reportedBy: result.reportedBy,
      status: result.status,
    });
    if (refusal) {
      return { ok: false, message: SETTLE_RESULT_REFUSAL_MESSAGES[refusal] };
    }

    const outcome = await onPending(tx, id.data, {
      winner: result.winner,
      noShowParty: result.noShowParty,
      offerJoin: join,
    });
    if (!outcome.ok) {
      return outcome;
    }
    return { ok: true, offerId: join.offerId, offerJoinId: join.id };
  });
}

/** The other player confirms a filed result (4.7): applies ELO once (4.8). */
export async function confirmResult(
  matchResultId: unknown,
): Promise<JoinChangeResult> {
  const user = await requireOnboardedUser();

  const outcome = await settleResult(
    matchResultId,
    user.id,
    async (tx, resultId, result) => {
      // Only a dispute or the cron settles a no-show report (decision
      // 2026-10-14) — there's nothing for the other side to manually
      // confirm about one.
      if (result.noShowParty) {
        return { ok: false, message: NO_SHOW_MANUAL_CONFIRM_REFUSED };
      }
      if (!result.winner) {
        throw new Error(
          "Pending result has neither a score nor a no-show party.",
        );
      }
      await applyMatchEloFromJoin(tx, resultId, {
        winner: result.winner,
        offerJoin: result.offerJoin,
      });
      return { ok: true };
    },
  );
  if (!outcome.ok) {
    return outcome;
  }

  await postSystemMessage(
    { offerJoinId: outcome.offerJoinId },
    RESULT_CONFIRMED_MESSAGE,
  );
  revalidatePath(`/offers/${outcome.offerId}`);
  return { ok: true };
}

/**
 * The other party disputes a filed result (4.7) — a score or a no-show
 * report (4.10) alike: no ELO change either way (session 08 decides a
 * disputed score; a disputed no-show never counts against anyone).
 */
export async function disputeResult(
  matchResultId: unknown,
): Promise<JoinChangeResult> {
  const user = await requireOnboardedUser();

  const outcome = await settleResult(
    matchResultId,
    user.id,
    async (tx, resultId) => {
      await tx.matchResult.update({
        where: { id: resultId },
        data: { status: "DISPUTED" },
      });
      return { ok: true };
    },
  );
  if (!outcome.ok) {
    return outcome;
  }

  await postSystemMessage(
    { offerJoinId: outcome.offerJoinId },
    RESULT_DISPUTED_MESSAGE,
  );
  revalidatePath(`/offers/${outcome.offerId}`);
  return { ok: true };
}
