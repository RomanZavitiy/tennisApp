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

  const join = await db.offerJoin.findUnique({
    where: { id: id.data },
    select: {
      userId: true,
      status: true,
      offerId: true,
      offer: { select: { authorId: true, format: true, startsAt: true } },
      result: { select: { id: true } },
    },
  });
  if (!join) {
    return { ok: false, message: JOIN_NOT_FOUND };
  }

  const party = partyOf(join, user.id);
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
      ok: false,
      message: SUBMIT_RESULT_REFUSAL_MESSAGES[refusal ?? "NOT_PARTICIPANT"],
    };
  }

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

type SettleOutcome =
  | { ok: true; offerId: string; offerJoinId: string }
  | { ok: false; message: string };

// One path for confirm and dispute (4.7): both are "the other party settles
// a still-pending result", only what they set it to differs. The row is
// locked first, like changeJoin (3.12) locks the offer — so a confirm
// racing another confirm (the "double confirmation" test) or a dispute runs
// one after the other, and the second one always sees a result that's no
// longer PENDING.
type PendingResult = {
  winner: MatchParty;
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

async function settleResult(
  matchResultId: unknown,
  userId: string,
  onPending: (
    tx: Prisma.TransactionClient,
    resultId: string,
    result: PendingResult,
  ) => Promise<void>,
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

    await onPending(tx, id.data, { winner: result.winner, offerJoin: join });
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
    (tx, resultId, result) => applyMatchEloFromJoin(tx, resultId, result),
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

/** The other player disputes a filed result (4.7): no ELO change (session 08 decides it). */
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
