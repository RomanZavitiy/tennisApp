import { randomUUID } from "node:crypto";

import { describe, expect, it } from "vitest";

import { db } from "@/lib/db";
import {
  createBookableClub,
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

  // Slice PD1 (migration 20261116120000_add_sport).
  const padel = { sport: "PADEL", format: "DOUBLES" } as const;

  it("is tennis unless told otherwise", async () => {
    const author = await createPlayer();
    expect((await createOffer(author.id)).sport).toBe("TENNIS");
  });

  it("refuses padel singles, allows padel doubles", async () => {
    const author = await createPlayer();
    await expectDbRejection(createOffer(author.id, { sport: "PADEL" }), {
      code: PG.checkViolation,
      mentions: "sparring_offers_padel_doubles_check",
    });
    expect((await createOffer(author.id, padel)).sport).toBe("PADEL");
  });

  it("lets a padel offer start its level range at 1.0, not below", async () => {
    const author = await createPlayer();
    const offer = await createOffer(author.id, {
      ...padel,
      ntrpMin: 1,
      ntrpMax: 1,
    });
    expect(offer.ntrpMin).toBe(1);
    await expectDbRejection(
      createOffer(author.id, { ...padel, ntrpMin: 0.5 }),
      {
        code: PG.checkViolation,
        mentions: "sparring_offers_ntrp_min_check",
      },
    );
    await expectDbRejection(
      createOffer(author.id, { ...padel, ntrpMax: 7.5 }),
      {
        code: PG.checkViolation,
        mentions: "sparring_offers_ntrp_max_check",
      },
    );
  });
});

describe("sparring_offers match gender (PD3, migration 20261117090000_add_match_gender)", () => {
  it("is open to anyone by default", async () => {
    const author = await createPlayer();
    expect((await createOffer(author.id)).matchGender).toBe("ANY");
  });

  it("refuses mixed singles, allows mixed doubles", async () => {
    const author = await createPlayer();
    await expectDbRejection(createOffer(author.id, { matchGender: "MIXED" }), {
      code: PG.checkViolation,
      mentions: "sparring_offers_mixed_doubles_check",
    });
    const offer = await createOffer(author.id, {
      matchGender: "MIXED",
      format: "DOUBLES",
    });
    expect(offer.matchGender).toBe("MIXED");
  });
});

describe("player_favorites (PD3, migration 20261117110000_add_player_favorites)", () => {
  it("keeps one row per pair and refuses a player as their own favourite", async () => {
    const [me, them] = await Promise.all([createPlayer(), createPlayer()]);
    await db.playerFavorite.create({
      data: { userId: me.id, favoriteId: them.id },
    });
    await expect(
      db.playerFavorite.create({
        data: { userId: me.id, favoriteId: them.id },
      }),
    ).rejects.toMatchObject({ code: "P2002" });
    await expectDbRejection(
      db.playerFavorite.create({ data: { userId: me.id, favoriteId: me.id } }),
      {
        code: PG.checkViolation,
        mentions: "player_favorites_not_self_check",
      },
    );
  });

  it("goes away with either player", async () => {
    const [me, them] = await Promise.all([createPlayer(), createPlayer()]);
    await db.playerFavorite.create({
      data: { userId: me.id, favoriteId: them.id },
    });
    await db.user.delete({ where: { id: them.id } });
    expect(await db.playerFavorite.count({ where: { userId: me.id } })).toBe(0);
  });
});

describe("sparring_offers invite token (PD3, migration 20261117120000_add_offer_invite_token)", () => {
  it("has no link by default and never gives two offers the same token", async () => {
    const author = await createPlayer();
    const first = await createOffer(author.id);
    expect(first.inviteToken).toBeNull();

    const token = `pd3-${randomUUID()}`;
    await db.sparringOffer.update({
      where: { id: first.id },
      data: { inviteToken: token },
    });
    await expect(
      createOffer(author.id, { inviteToken: token }),
    ).rejects.toMatchObject({ code: "P2002" });
    // Any number of offers can have the link off.
    await createOffer(author.id);
    await createOffer(author.id);
  });
});

describe("play_intents (PD2, migration 20261116210000_add_play_intent_sport)", () => {
  const intent = (userId: string, date: string) => ({
    userId,
    date: new Date(`${date}T00:00:00Z`),
    times: ["evening"],
    districts: ["KROWODRZA" as const],
    expiresAt: hoursFromNow(24),
  });

  it("makes an intent tennis by default", async () => {
    const player = await createPlayer();
    const row = await db.playIntent.create({
      data: intent(player.id, "2030-01-10"),
    });
    expect(row.sport).toBe("TENNIS");
  });

  it("refuses padel singles, allows padel doubles", async () => {
    const player = await createPlayer();
    await expectDbRejection(
      db.playIntent.create({
        data: { ...intent(player.id, "2030-01-10"), sport: "PADEL" },
      }),
      {
        code: PG.checkViolation,
        mentions: "play_intents_padel_doubles_check",
      },
    );
    const row = await db.playIntent.create({
      data: {
        ...intent(player.id, "2030-01-10"),
        sport: "PADEL",
        format: "DOUBLES",
      },
    });
    expect(row.sport).toBe("PADEL");
  });

  it("allows one intent per day per sport, not two in the same sport", async () => {
    const player = await createPlayer();
    await db.playIntent.create({ data: intent(player.id, "2030-01-10") });
    await db.playIntent.create({
      data: {
        ...intent(player.id, "2030-01-10"),
        sport: "PADEL",
        format: "DOUBLES",
      },
    });
    // Prisma's own code for a unique violation (the new index on user,
    // sport and date).
    await expect(
      db.playIntent.create({ data: intent(player.id, "2030-01-10") }),
    ).rejects.toMatchObject({ code: "P2002" });
  });
});

describe("courts (PD2, migration 20261116220000_add_court_sport)", () => {
  it("makes a court tennis by default and keeps a padel one", async () => {
    const { club, court } = await createBookableClub();
    expect(court.sport).toBe("TENNIS");
    const padel = await db.court.create({
      data: {
        clubId: club.id,
        name: "Padel 1",
        surface: "ARTIFICIAL_GRASS",
        sport: "PADEL",
      },
    });
    expect(padel.sport).toBe("PADEL");
  });
});

describe("padel profile and clubs (PD1)", () => {
  it.each([0.5, 2.25, 7.5])("refuses padel level %s", async (padelLevel) => {
    await expectDbRejection(createPlayer({ padelLevel }), {
      code: PG.checkViolation,
      mentions: "users_padel_level_check",
    });
  });

  it("allows padel levels 1.0 and 7.0, and none at all", async () => {
    expect((await createPlayer({ padelLevel: 1 })).padelLevel).toBe(1);
    expect((await createPlayer({ padelLevel: 7 })).padelLevel).toBe(7);
    expect((await createPlayer()).padelLevel).toBeNull();
  });

  it("makes a club tennis by default and refuses one with no sport", async () => {
    const club = {
      name: "Padel test club",
      address: "ul. Testowa 1, Kraków",
      latitude: 50.06,
      longitude: 19.94,
      courtCount: 2,
      surfaces: ["ARTIFICIAL_GRASS" as const],
      verifiedAt: new Date("2026-11-16"),
    };
    const created = await db.club.create({
      data: { ...club, slug: `pd1-default-sport-${randomUUID()}` },
    });
    expect(created.sports).toEqual(["TENNIS"]);
    await expectDbRejection(
      db.club.create({
        data: { ...club, slug: `pd1-no-sport-${randomUUID()}`, sports: [] },
      }),
      { code: PG.checkViolation, mentions: "clubs_sports_not_empty_check" },
    );
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
