import { describe, expect, it } from "vitest";

import { confirmResult, submitNoShow } from "@/app/offers/[id]/result-actions";
import { db } from "@/lib/db";
import { autoConfirmExpiredResults } from "@/lib/rating/auto-confirm";
import { computeEloChange } from "@/lib/rating/elo";
import {
  createPlayedMatch,
  hoursFromNow,
  STARTING_ELO,
} from "@/tests/integration/helpers/fixtures";
import { runAs } from "@/tests/integration/helpers/session";

// "ELO moves exactly once per result": the `SELECT ... FOR UPDATE` on the
// match_results row plus the status re-check under it, in confirmResult and
// in the auto-confirm cron. Two callers at once is the only real test.

const WINNER_ELO = computeEloChange({
  elo: STARTING_ELO,
  opponentElo: STARTING_ELO,
  outcome: "WIN",
  matchesPlayed: 0,
});
const LOSER_ELO = computeEloChange({
  elo: STARTING_ELO,
  opponentElo: STARTING_ELO,
  outcome: "LOSS",
  matchesPlayed: 0,
});

/** A played match with a score the author filed (and won), still PENDING. */
async function createPendingResult(autoConfirmAt: Date = hoursFromNow(72)) {
  const match = await createPlayedMatch();
  const result = await db.matchResult.create({
    data: {
      offerJoinId: match.join.id,
      score: [
        [6, 3],
        [6, 4],
      ],
      winner: "AUTHOR",
      reportedBy: "AUTHOR",
      autoConfirmAt,
    },
  });
  return { ...match, result };
}

function ratings(...userIds: string[]) {
  return Promise.all(
    userIds.map((id) =>
      db.user.findUniqueOrThrow({
        where: { id },
        select: { elo: true, matchesPlayed: true, noShows: true },
      }),
    ),
  );
}

async function expectAppliedOnce(
  match: Awaited<ReturnType<typeof createPendingResult>>,
) {
  const [author, player] = await ratings(match.author.id, match.player.id);
  expect(author).toEqual({ elo: WINNER_ELO, matchesPlayed: 1, noShows: 0 });
  expect(player).toEqual({ elo: LOSER_ELO, matchesPlayed: 1, noShows: 0 });
  expect(
    await db.matchResult.findUniqueOrThrow({ where: { id: match.result.id } }),
  ).toMatchObject({
    status: "CONFIRMED",
    authorEloBefore: STARTING_ELO,
    authorEloAfter: WINNER_ELO,
    playerEloBefore: STARTING_ELO,
    playerEloAfter: LOSER_ELO,
  });
  // One "confirmed" notice in the thread, whichever path wrote it.
  const notices = await db.message.findMany({
    where: {
      offerJoinId: match.join.id,
      content: { in: ["RESULT_CONFIRMED", "RESULT_AUTO_CONFIRMED"] },
    },
  });
  expect(notices).toHaveLength(1);
}

describe("confirmResult", () => {
  it("moves ELO and matchesPlayed once when confirmed twice at the same moment", async () => {
    const match = await createPendingResult();
    expect(WINNER_ELO).toBeGreaterThan(STARTING_ELO);

    const outcomes = await Promise.all([
      runAs(match.player.id, () => confirmResult(match.result.id)),
      runAs(match.player.id, () => confirmResult(match.result.id)),
    ]);

    expect(outcomes).toContainEqual({ ok: true });
    expect(outcomes).toContainEqual({
      ok: false,
      message: "This result has already been settled.",
    });
    await expectAppliedOnce(match);
  });

  it("moves ELO once when the cron's auto-confirm and a manual confirm race", async () => {
    const match = await createPendingResult(hoursFromNow(-1));

    const [, manual] = await Promise.all([
      autoConfirmExpiredResults(),
      runAs(match.player.id, () => confirmResult(match.result.id)),
    ]);

    // Either side may win the race; the loser must find it settled.
    if (!manual.ok) {
      expect(manual.message).toBe("This result has already been settled.");
    }
    await expectAppliedOnce(match);
  });

  it("moves ELO once when the cron runs twice at the same moment", async () => {
    const match = await createPendingResult(hoursFromNow(-1));

    await Promise.all([
      autoConfirmExpiredResults(),
      autoConfirmExpiredResults(),
    ]);

    await expectAppliedOnce(match);
  });

  it("leaves a result alone until its 72 hours are up", async () => {
    const match = await createPendingResult(hoursFromNow(1));

    await autoConfirmExpiredResults();

    const result = await db.matchResult.findUniqueOrThrow({
      where: { id: match.result.id },
    });
    expect(result.status).toBe("PENDING");
    const [author] = await ratings(match.author.id);
    expect(author).toMatchObject({ elo: STARTING_ELO, matchesPlayed: 0 });
  });
});

describe("no-show", () => {
  it("settles as NO_SHOW: no ELO, no matchesPlayed, one noShows for the reported player only", async () => {
    const match = await createPlayedMatch();
    // The author showed up and reports that the player didn't.
    const filed = await runAs(match.author.id, () =>
      submitNoShow(match.join.id),
    );
    expect(filed).toEqual({ ok: true });
    const result = await db.matchResult.findUniqueOrThrow({
      where: { offerJoinId: match.join.id },
    });
    expect(result).toMatchObject({
      status: "PENDING",
      noShowParty: "PLAYER",
      reportedBy: "AUTHOR",
      score: null,
      winner: null,
    });

    // The reported player can't "confirm" it by hand...
    const manual = await runAs(match.player.id, () => confirmResult(result.id));
    expect(manual.ok).toBe(false);

    // ...only the deadline settles it. Run twice at once: still one count.
    await db.matchResult.update({
      where: { id: result.id },
      data: { autoConfirmAt: hoursFromNow(-1) },
    });
    await Promise.all([
      autoConfirmExpiredResults(),
      autoConfirmExpiredResults(),
    ]);

    const [author, player] = await ratings(match.author.id, match.player.id);
    expect(author).toEqual({ elo: STARTING_ELO, matchesPlayed: 0, noShows: 0 });
    expect(player).toEqual({ elo: STARTING_ELO, matchesPlayed: 0, noShows: 1 });
    expect(
      await db.matchResult.findUniqueOrThrow({ where: { id: result.id } }),
    ).toMatchObject({
      status: "NO_SHOW",
      authorEloBefore: null,
      authorEloAfter: null,
      playerEloBefore: null,
      playerEloAfter: null,
    });
  });

  it("files one report when both sides report each other at the same moment", async () => {
    const match = await createPlayedMatch();

    const outcomes = await Promise.all([
      runAs(match.author.id, () => submitNoShow(match.join.id)),
      runAs(match.player.id, () => submitNoShow(match.join.id)),
    ]);

    expect(outcomes.filter((outcome) => outcome.ok)).toHaveLength(1);
    expect(
      await db.matchResult.count({ where: { offerJoinId: match.join.id } }),
    ).toBe(1);
  });
});
