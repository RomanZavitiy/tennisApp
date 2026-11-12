import { describe, expect, it } from "vitest";

import { db } from "@/lib/db";
import { redactAccountData } from "@/lib/privacy/delete-account";
import { expectDbRejection, PG } from "@/tests/integration/helpers/db-errors";
import {
  createJoin,
  createOffer,
  createPlayedMatch,
  createPlayer,
  hoursFromNow,
} from "@/tests/integration/helpers/fixtures";

// Account deletion's database half (task 6.15). The Storage/Auth half talks
// to Supabase's admin API and isn't part of this.

/** A played match whose result is CONFIRMED, with both ratings moved. */
async function createConfirmedMatch() {
  const match = await createPlayedMatch();
  const result = await db.matchResult.create({
    data: {
      offerJoinId: match.join.id,
      status: "CONFIRMED",
      score: [
        [6, 3],
        [6, 4],
      ],
      winner: "AUTHOR",
      reportedBy: "AUTHOR",
      autoConfirmAt: hoursFromNow(-1),
      authorEloBefore: 1500,
      authorEloAfter: 1516,
      playerEloBefore: 1500,
      playerEloAfter: 1484,
    },
  });
  return { ...match, result };
}

describe("redactAccountData", () => {
  it("goes through for a player with a confirmed result, and keeps the result", async () => {
    const { player, author, join, result } = await createConfirmedMatch();
    await db.message.create({
      data: {
        senderId: player.id,
        content: "See you at 6",
        offerJoinId: join.id,
      },
    });

    await redactAccountData(player.id);

    const redacted = await db.user.findUniqueOrThrow({
      where: { id: player.id },
    });
    expect(redacted).toMatchObject({
      name: null,
      email: null,
      birthDate: null,
      avatarPath: null,
      // Cleared with them: the onboarding CHECK needs a name and birth date.
      onboardingCompletedAt: null,
      // Not personal data, and what the opponent's history is built on.
      elo: 1500,
    });
    // The opponent's history survives: the result, its snapshots, the join.
    expect(
      await db.matchResult.findUniqueOrThrow({ where: { id: result.id } }),
    ).toMatchObject({
      status: "CONFIRMED",
      authorEloAfter: 1516,
      playerEloAfter: 1484,
    });
    expect(
      await db.offerJoin.findUniqueOrThrow({ where: { id: join.id } }),
    ).toMatchObject({ userId: player.id, status: "ACCEPTED" });
    const message = await db.message.findFirstOrThrow({
      where: { senderId: player.id },
    });
    expect(message.content).toBe("[deleted]");
    // The other player is untouched.
    expect(
      await db.user.findUniqueOrThrow({ where: { id: author.id } }),
    ).toMatchObject({ name: "Author" });
  });

  it("goes through for the author side of a confirmed result too", async () => {
    const { author, result } = await createConfirmedMatch();

    await redactAccountData(author.id);

    expect(
      await db.user.findUniqueOrThrow({ where: { id: author.id } }),
    ).toMatchObject({ name: null, email: null, birthDate: null });
    expect(await db.matchResult.count({ where: { id: result.id } })).toBe(1);
  });

  it("cancels the player's live offers and withdraws their live requests", async () => {
    const player = await createPlayer();
    const other = await createPlayer();
    const ownOffer = await createOffer(player.id);
    const otherOffer = await createOffer(other.id);
    const request = await createJoin(otherOffer.id, player.id);
    await db.notification.create({
      data: {
        userId: player.id,
        kind: "JOIN_ACCEPTED",
        offerId: otherOffer.id,
      },
    });

    await redactAccountData(player.id);

    expect(
      await db.sparringOffer.findUniqueOrThrow({ where: { id: ownOffer.id } }),
    ).toMatchObject({ status: "CANCELLED" });
    expect(
      await db.offerJoin.findUniqueOrThrow({ where: { id: request.id } }),
    ).toMatchObject({ status: "WITHDRAWN" });
    expect(await db.notification.count({ where: { userId: player.id } })).toBe(
      0,
    );
  });

  it("is why the row is redacted, not deleted: a hard delete is refused by the result's Restrict", async () => {
    const { player, result } = await createConfirmedMatch();

    await expectDbRejection(db.user.delete({ where: { id: player.id } }), {
      code: PG.foreignKeyViolation,
      mentions: "match_results_offer_join_id_fkey",
    });
    expect(await db.matchResult.count({ where: { id: result.id } })).toBe(1);
  });
});
