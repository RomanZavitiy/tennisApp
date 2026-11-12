import { describe, expect, it } from "vitest";

import { db } from "@/lib/db";
import {
  createJoin,
  createOffer,
  createPlayedMatch,
  createPlayer,
  hoursFromNow,
} from "@/tests/integration/helpers/fixtures";
import { expectDbRejection, PG } from "@/tests/integration/helpers/db-errors";

// The hand-written CHECK constraints from prisma/migrations. Prisma's schema
// can't express them and the unit tests mock the database, so this is the
// only place a dropped or mistyped constraint would show up.

describe("users", () => {
  it("refuses a finished onboarding with a profile field missing", async () => {
    for (const missing of [
      { name: null },
      { birthDate: null },
      { gender: null },
      { district: null },
      { selfRatedNtrp: null },
    ]) {
      await expectDbRejection(createPlayer(missing), {
        code: PG.checkViolation,
        mentions: "users_onboarded_profile_complete_check",
      });
    }
  });

  it("refuses a finished onboarding without a rating", async () => {
    await expectDbRejection(createPlayer({ elo: null }), {
      code: PG.checkViolation,
      mentions: "users_onboarded_elo_check",
    });
  });

  it("allows an empty profile before onboarding", async () => {
    const user = await createPlayer({
      name: null,
      birthDate: null,
      gender: null,
      district: null,
      selfRatedNtrp: null,
      elo: null,
      onboardingCompletedAt: null,
    });
    expect(user.onboardingCompletedAt).toBeNull();
  });

  it.each([1, 1.4, 7.5, 3.3, 3.25])(
    "refuses NTRP %s (outside 1.5-7.0 or not a multiple of 0.5)",
    async (ntrp) => {
      await expectDbRejection(createPlayer({ selfRatedNtrp: ntrp }), {
        code: PG.checkViolation,
        mentions: "users_self_rated_ntrp_check",
      });
    },
  );

  it.each([1.5, 4, 4.5, 7])("allows NTRP %s", async (ntrp) => {
    const user = await createPlayer({ selfRatedNtrp: ntrp });
    expect(user.selfRatedNtrp).toBe(ntrp);
  });
});

describe("sparring_offers", () => {
  it.each([
    [{ ntrpMin: 1 }, "sparring_offers_ntrp_min_check"],
    [{ ntrpMax: 7.5 }, "sparring_offers_ntrp_max_check"],
    [{ ntrpMin: 2.75 }, "sparring_offers_ntrp_min_check"],
    [{ ntrpMin: 4, ntrpMax: 3 }, "sparring_offers_ntrp_range_check"],
  ])("refuses the level range %o", async (range, constraint) => {
    const author = await createPlayer();
    await expectDbRejection(createOffer(author.id, range), {
      code: PG.checkViolation,
      mentions: constraint,
    });
  });
});

describe("messages", () => {
  it("refuses a message in no thread", async () => {
    const sender = await createPlayer();
    await expectDbRejection(
      db.message.create({ data: { senderId: sender.id, content: "hello" } }),
      { code: PG.checkViolation, mentions: "messages_one_thread_check" },
    );
  });

  it("refuses a message in two threads at once", async () => {
    const { author, offer, join } = await createPlayedMatch();
    await expectDbRejection(
      db.message.create({
        data: {
          senderId: author.id,
          content: "hello",
          offerJoinId: join.id,
          offerId: offer.id,
        },
      }),
      { code: PG.checkViolation, mentions: "messages_one_thread_check" },
    );
  });

  it("refuses a SYSTEM message with a sender, and a TEXT one without", async () => {
    const { author, join } = await createPlayedMatch();
    await expectDbRejection(
      db.message.create({
        data: {
          type: "SYSTEM",
          senderId: author.id,
          content: "THREAD_WELCOME",
          offerJoinId: join.id,
        },
      }),
      {
        code: PG.checkViolation,
        mentions: "messages_system_has_no_sender_check",
      },
    );
    await expectDbRejection(
      db.message.create({ data: { content: "hello", offerJoinId: join.id } }),
      {
        code: PG.checkViolation,
        mentions: "messages_system_has_no_sender_check",
      },
    );
  });

  it("refuses a blank message", async () => {
    const { author, join } = await createPlayedMatch();
    await expectDbRejection(
      db.message.create({
        data: { senderId: author.id, content: "   ", offerJoinId: join.id },
      }),
      { code: PG.checkViolation, mentions: "messages_content_not_blank_check" },
    );
  });
});

describe("match_feedback", () => {
  it("refuses more than three tags, allows three", async () => {
    const { author, player, join } = await createPlayedMatch();
    const result = await db.matchResult.create({
      data: {
        offerJoinId: join.id,
        score: [
          [6, 3],
          [6, 4],
        ],
        winner: "AUTHOR",
        reportedBy: "AUTHOR",
        autoConfirmAt: hoursFromNow(72),
      },
    });
    const feedback = {
      matchResultId: result.id,
      giverId: author.id,
      receiverId: player.id,
    };

    await expectDbRejection(
      db.matchFeedback.create({
        data: {
          ...feedback,
          tags: ["PUNCTUAL", "GOOD_GAME", "LEVEL_MATCHES_NTRP", "PUNCTUAL"],
        },
      }),
      { code: PG.checkViolation, mentions: "match_feedback_tags_check" },
    );
    const saved = await db.matchFeedback.create({
      data: {
        ...feedback,
        tags: ["PUNCTUAL", "GOOD_GAME", "LEVEL_MATCHES_NTRP"],
      },
    });
    expect(saved.tags).toHaveLength(3);
  });
});

describe("reports", () => {
  it("refuses a report about an offer and a message at once", async () => {
    const { author, player, offer, join } = await createPlayedMatch();
    const message = await db.message.create({
      data: { senderId: author.id, content: "hello", offerJoinId: join.id },
    });
    const report = {
      reporterId: player.id,
      targetUserId: author.id,
      reason: "ABUSIVE" as const,
    };

    await expectDbRejection(
      db.report.create({
        data: { ...report, offerId: offer.id, messageId: message.id },
      }),
      {
        code: PG.checkViolation,
        mentions: "reports_at_most_one_context_check",
      },
    );
    // Either one alone, or neither, is a valid report.
    await db.report.create({ data: { ...report, offerId: offer.id } });
    await db.report.create({ data: { ...report, messageId: message.id } });
    await db.report.create({ data: report });
  });
});

describe("match_results", () => {
  it("refuses ELO snapshots on a result that isn't CONFIRMED, and CONFIRMED without them", async () => {
    const { offer } = await createPlayedMatch();
    const other = await createPlayer();
    const join = await createJoin(offer.id, other.id, { status: "ACCEPTED" });
    const result = {
      offerJoinId: join.id,
      score: [
        [6, 3],
        [6, 4],
      ],
      winner: "AUTHOR" as const,
      reportedBy: "AUTHOR" as const,
      autoConfirmAt: hoursFromNow(72),
    };

    await expectDbRejection(
      db.matchResult.create({ data: { ...result, status: "CONFIRMED" } }),
      {
        code: PG.checkViolation,
        mentions: "match_results_elo_with_confirmed_check",
      },
    );
    await expectDbRejection(
      db.matchResult.create({
        data: {
          ...result,
          authorEloBefore: 1500,
          authorEloAfter: 1516,
          playerEloBefore: 1500,
          playerEloAfter: 1484,
        },
      }),
      {
        code: PG.checkViolation,
        mentions: "match_results_elo_with_confirmed_check",
      },
    );
  });
});
