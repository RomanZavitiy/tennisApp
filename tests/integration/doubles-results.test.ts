import { describe, expect, it } from "vitest";

import {
  annulDisputedDoublesResult,
  confirmDisputedDoublesResult,
} from "@/app/admin/actions";
import {
  confirmDoublesResult,
  disputeDoublesResult,
  rateDoublesPlayer,
  submitDoublesNoShow,
  submitDoublesResult,
} from "@/app/offers/[id]/doubles-result-actions";
import { db } from "@/lib/db";
import { autoConfirmExpiredDoublesResults } from "@/lib/rating/doubles-cron";
import { expectDbRejection, PG } from "@/tests/integration/helpers/db-errors";
import {
  createJoin,
  createOffer,
  createPlayer,
  hoursFromNow,
} from "@/tests/integration/helpers/fixtures";
import { runAs } from "@/tests/integration/helpers/session";

// Slice PD4 (migration 20261124100000_add_doubles_results): the doubles
// result's CHECKs, and the whole file → confirm → padel ELO path on a real
// database, including "ELO moves exactly once" under two confirms at once.

const SCORE = {
  sets: [
    { author: 6, player: 4 },
    { author: 6, player: 3 },
  ],
  winner: "AUTHOR",
};

/** A padel game that started yesterday, every place taken, everyone at 3.5. */
async function createPlayedPadelGame(sport: "PADEL" | "TENNIS" = "PADEL") {
  const padel = { padelLevel: 3.5, padelElo: 1500 };
  const author = await createPlayer({ name: "Author", ...padel });
  const p1 = await createPlayer({ name: "P1", ...padel });
  const p2 = await createPlayer({ name: "P2", ...padel });
  const p3 = await createPlayer({ name: "P3", ...padel });
  const offer = await createOffer(author.id, {
    sport,
    format: "DOUBLES",
    status: "FULL",
    startsAt: hoursFromNow(-24),
  });
  for (const player of [p1, p2, p3]) {
    await createJoin(offer.id, player.id, { status: "ACCEPTED" });
  }
  return { author, p1, p2, p3, offer };
}

function padelRatings(...ids: string[]) {
  return Promise.all(
    ids.map((id) =>
      db.user.findUniqueOrThrow({
        where: { id },
        select: {
          padelElo: true,
          padelMatchesPlayed: true,
          elo: true,
          scheduledMatches: true,
          noShows: true,
        },
      }),
    ),
  );
}

describe("doubles_results CHECKs", () => {
  it("refuses a row that is neither a score nor a no-show", async () => {
    const { author, offer } = await createPlayedPadelGame();
    await expectDbRejection(
      db.doublesResult.create({
        data: {
          offerId: offer.id,
          reportedById: author.id,
          autoConfirmAt: hoursFromNow(72),
        },
      }),
      { code: PG.checkViolation, mentions: "doubles_results_kind_check" },
    );
  });

  it("refuses the same player on both sides", async () => {
    const { author, p1, p2, offer } = await createPlayedPadelGame();
    await expectDbRejection(
      db.doublesResult.create({
        data: {
          offerId: offer.id,
          reportedById: author.id,
          authorPartnerId: p1.id,
          opponent1Id: p1.id,
          opponent2Id: p2.id,
          score: SCORE.sets,
          winner: "AUTHOR",
          autoConfirmAt: hoursFromNow(72),
        },
      }),
      {
        code: PG.checkViolation,
        mentions: "doubles_results_distinct_players_check",
      },
    );
  });

  it("refuses a non-positive padel ELO", async () => {
    await expectDbRejection(createPlayer({ padelElo: 0 }), {
      code: PG.checkViolation,
      mentions: "users_padel_elo_check",
    });
  });

  it("refuses feedback that belongs to no result", async () => {
    const giver = await createPlayer();
    const receiver = await createPlayer();
    await expectDbRejection(
      db.matchFeedback.create({
        data: { giverId: giver.id, receiverId: receiver.id },
      }),
      { code: PG.checkViolation, mentions: "match_feedback_one_result_check" },
    );
  });
});

describe("filing and confirming a doubles result", () => {
  it("moves every player's padel ELO once, and leaves the tennis ELO alone", async () => {
    const { author, p1, p2, p3, offer } = await createPlayedPadelGame();
    const tennisBefore = (await padelRatings(author.id))[0]?.elo;

    expect(
      await runAs(p1.id, () =>
        submitDoublesResult(offer.id, { ...SCORE, authorPartnerId: p1.id }),
      ),
    ).toEqual({ ok: true });
    const result = await db.doublesResult.findUniqueOrThrow({
      where: { offerId: offer.id },
    });

    // The other pair confirms twice at once: only one may apply.
    const outcomes = await Promise.all([
      runAs(p2.id, () => confirmDoublesResult(result.id)),
      runAs(p3.id, () => confirmDoublesResult(result.id)),
    ]);
    expect(outcomes.filter((outcome) => outcome.ok)).toHaveLength(1);

    const [a, b, c, d] = await padelRatings(author.id, p1.id, p2.id, p3.id);
    expect([a.padelElo, b.padelElo, c.padelElo, d.padelElo]).toEqual([
      1520, 1520, 1480, 1480,
    ]);
    expect(a.padelMatchesPlayed).toBe(1);
    expect(a.scheduledMatches).toBe(1);
    expect(a.elo).toBe(tennisBefore);
  });

  it("refuses a confirmation from the filer's own pair", async () => {
    const { author, p1, offer } = await createPlayedPadelGame();
    await runAs(author.id, () =>
      submitDoublesResult(offer.id, { ...SCORE, authorPartnerId: p1.id }),
    );
    const result = await db.doublesResult.findUniqueOrThrow({
      where: { offerId: offer.id },
    });

    expect((await runAs(p1.id, () => confirmDoublesResult(result.id))).ok).toBe(
      false,
    );
  });

  it("records a tennis doubles result without any rating moving", async () => {
    const { author, p1, p2, offer } = await createPlayedPadelGame("TENNIS");
    await runAs(author.id, () =>
      submitDoublesResult(offer.id, { ...SCORE, authorPartnerId: p1.id }),
    );
    const result = await db.doublesResult.findUniqueOrThrow({
      where: { offerId: offer.id },
    });
    await runAs(p2.id, () => confirmDoublesResult(result.id));

    const settled = await db.doublesResult.findUniqueOrThrow({
      where: { id: result.id },
    });
    expect(settled.status).toBe("CONFIRMED");
    expect(settled.eloChanges).toBeNull();
    const [a] = await padelRatings(author.id);
    expect(a.padelElo).toBe(1500);
  });

  it("lets each player rate the others once after confirmation", async () => {
    const { author, p1, p2, offer } = await createPlayedPadelGame();
    await runAs(author.id, () =>
      submitDoublesResult(offer.id, { ...SCORE, authorPartnerId: p1.id }),
    );
    const result = await db.doublesResult.findUniqueOrThrow({
      where: { offerId: offer.id },
    });
    await runAs(p2.id, () => confirmDoublesResult(result.id));

    const rate = (receiverId: string) =>
      runAs(author.id, () =>
        rateDoublesPlayer(result.id, receiverId, {
          tags: ["GOOD_GAME"],
          levelSignal: null,
        }),
      );
    expect(await rate(p1.id)).toEqual({ ok: true });
    expect(await rate(p2.id)).toEqual({ ok: true });
    expect((await rate(p1.id)).ok).toBe(false);
  });
});

describe("a doubles no-show report", () => {
  it("is settled by the cron after 72h against the named player only", async () => {
    const { author, p1, p2, offer } = await createPlayedPadelGame();
    await runAs(author.id, () => submitDoublesNoShow(offer.id, p2.id));
    await db.doublesResult.update({
      where: { offerId: offer.id },
      data: { autoConfirmAt: hoursFromNow(-1) },
    });

    await autoConfirmExpiredDoublesResults();
    // A second run finds nothing left to settle.
    await autoConfirmExpiredDoublesResults();

    const settled = await db.doublesResult.findUniqueOrThrow({
      where: { offerId: offer.id },
    });
    expect(settled.status).toBe("NO_SHOW");
    const [a, b, c] = await padelRatings(author.id, p1.id, p2.id);
    expect([a.noShows, b.noShows, c.noShows]).toEqual([0, 0, 1]);
    expect(c.scheduledMatches).toBe(1);
    expect(c.padelElo).toBe(1500);
  });
});

// The admin queue for a disputed doubles result (slice PD4 follow-up,
// migration 20261125100000_add_admin_action_doubles_result).
describe("a disputed doubles result in the admin queue", () => {
  async function disputedScore() {
    const game = await createPlayedPadelGame();
    await runAs(game.p1.id, () =>
      submitDoublesResult(game.offer.id, {
        ...SCORE,
        authorPartnerId: game.p1.id,
      }),
    );
    const result = await db.doublesResult.findUniqueOrThrow({
      where: { offerId: game.offer.id },
    });
    expect(
      await runAs(game.p2.id, () => disputeDoublesResult(result.id)),
    ).toEqual({ ok: true });
    const admin = await createPlayer({ name: "Admin", isAdmin: true });
    return { ...game, result, admin };
  }

  it("an admin's confirm moves the padel ELO once and is logged", async () => {
    const { author, p1, p2, p3, result, admin } = await disputedScore();

    const outcomes = await Promise.all([
      runAs(admin.id, () => confirmDisputedDoublesResult(result.id)),
      runAs(admin.id, () => confirmDisputedDoublesResult(result.id)),
    ]);
    expect(outcomes.filter((outcome) => outcome.ok)).toHaveLength(1);

    const [a, b, c, d] = await padelRatings(author.id, p1.id, p2.id, p3.id);
    expect([a.padelElo, b.padelElo, c.padelElo, d.padelElo]).toEqual([
      1520, 1520, 1480, 1480,
    ]);
    expect(
      (await db.doublesResult.findUniqueOrThrow({ where: { id: result.id } }))
        .status,
    ).toBe("CONFIRMED");
    const logged = await db.adminAction.findMany({
      where: { doublesResultId: result.id },
    });
    expect(logged.map((row) => row.action)).toEqual(["CONFIRM_RESULT"]);
  });

  it("an admin's annul leaves every rating and counter as it was", async () => {
    const { author, p2, result, admin } = await disputedScore();

    expect(
      await runAs(admin.id, () => annulDisputedDoublesResult(result.id)),
    ).toEqual({ ok: true });

    const [a, c] = await padelRatings(author.id, p2.id);
    expect([a.padelElo, c.padelElo]).toEqual([1500, 1500]);
    expect([a.scheduledMatches, c.scheduledMatches]).toEqual([0, 0]);
    expect(
      (await db.doublesResult.findUniqueOrThrow({ where: { id: result.id } }))
        .status,
    ).toBe("ANNULLED");
    // Settled once: a confirm after the annul is refused.
    expect(
      (await runAs(admin.id, () => confirmDisputedDoublesResult(result.id))).ok,
    ).toBe(false);
  });

  it("refuses an admin action that points at nothing", async () => {
    const admin = await createPlayer({ name: "Admin", isAdmin: true });

    await expectDbRejection(
      db.adminAction.create({
        data: { adminId: admin.id, action: "CONFIRM_RESULT" },
      }),
      { code: PG.checkViolation, mentions: "admin_actions_has_target_check" },
    );
  });
});
