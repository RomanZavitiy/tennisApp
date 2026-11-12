import { describe, expect, it, vi } from "vitest";

import {
  acceptJoin,
  requestToJoin,
  withdrawJoin,
} from "@/app/offers/[id]/actions";
import { db } from "@/lib/db";
import { notify } from "@/lib/notifications/notify";
import {
  createJoin,
  createOffer,
  createPlayer,
} from "@/tests/integration/helpers/fixtures";
import { runAs } from "@/tests/integration/helpers/session";

// The join flow's concurrency guards, which only a real database can show:
// `SELECT ... FOR UPDATE` on the offer row (changeJoin) and ON CONFLICT DO
// NOTHING on the (offer, player) pair (requestToJoin).

describe("acceptJoin", () => {
  it("accepts exactly one of two simultaneous accepts for the last place", async () => {
    const author = await createPlayer();
    const [first, second] = [await createPlayer(), await createPlayer()];
    const offer = await createOffer(author.id);
    const joins = [
      await createJoin(offer.id, first.id),
      await createJoin(offer.id, second.id),
    ];

    const outcomes = await Promise.all(
      joins.map((join) => runAs(author.id, () => acceptJoin(join.id))),
    );

    expect(outcomes).toContainEqual({ ok: true });
    expect(outcomes).toContainEqual({
      ok: false,
      message: "Every place in this game is taken.",
    });
    const after = await db.sparringOffer.findUniqueOrThrow({
      where: { id: offer.id },
      select: { status: true, joins: { select: { status: true } } },
    });
    expect(after.status).toBe("FULL");
    expect(after.joins.map((join) => join.status).sort()).toEqual([
      "ACCEPTED",
      "REQUESTED",
    ]);
    // One scheduled match for the author, not two.
    const { scheduledMatches } = await db.user.findUniqueOrThrow({
      where: { id: author.id },
    });
    expect(scheduledMatches).toBe(1);
  });

  it("fills a doubles offer with three places, and no more, under a burst of accepts", async () => {
    const author = await createPlayer();
    const offer = await createOffer(author.id, { format: "DOUBLES" });
    const joins = [];
    for (let i = 0; i < 5; i++) {
      const player = await createPlayer();
      joins.push(await createJoin(offer.id, player.id));
    }

    const outcomes = await Promise.all(
      joins.map((join) => runAs(author.id, () => acceptJoin(join.id))),
    );

    expect(outcomes.filter((outcome) => outcome.ok)).toHaveLength(3);
    const after = await db.sparringOffer.findUniqueOrThrow({
      where: { id: offer.id },
      select: {
        status: true,
        _count: { select: { joins: { where: { status: "ACCEPTED" } } } },
      },
    });
    expect(after).toEqual({ status: "FULL", _count: { joins: 3 } });
  });
});

describe("withdrawJoin", () => {
  it("reopens a full offer and promotes the longest-waiting player", async () => {
    const author = await createPlayer();
    const accepted = await createPlayer();
    const [waitingFirst, waitingSecond] = [
      await createPlayer(),
      await createPlayer(),
    ];
    const offer = await createOffer(author.id, { status: "FULL" });
    const join = await createJoin(offer.id, accepted.id, {
      status: "ACCEPTED",
    });
    await db.offerWaitlist.create({
      data: {
        offerId: offer.id,
        userId: waitingFirst.id,
        createdAt: new Date(Date.now() - 60_000),
      },
    });
    await db.offerWaitlist.create({
      data: { offerId: offer.id, userId: waitingSecond.id },
    });
    vi.mocked(notify).mockClear();

    const outcome = await runAs(accepted.id, () => withdrawJoin(join.id));

    expect(outcome).toEqual({ ok: true });
    const after = await db.sparringOffer.findUniqueOrThrow({
      where: { id: offer.id },
      select: {
        status: true,
        joins: {
          select: { userId: true, status: true, fromWaitlist: true },
        },
        waitlist: { select: { userId: true } },
      },
    });
    expect(after.status).toBe("OPEN");
    expect(after.joins).toHaveLength(2);
    expect(after.joins).toContainEqual({
      userId: accepted.id,
      status: "WITHDRAWN",
      fromWaitlist: false,
    });
    expect(after.joins).toContainEqual({
      userId: waitingFirst.id,
      status: "REQUESTED",
      fromWaitlist: true,
    });
    expect(after.waitlist).toEqual([{ userId: waitingSecond.id }]);
    expect(notify).toHaveBeenCalledWith(waitingFirst.id, {
      kind: "SPOT_OPENED",
      offerId: offer.id,
    });
  });

  it("promotes each waiting player once when two accepted players leave at the same moment", async () => {
    const author = await createPlayer();
    const offer = await createOffer(author.id, {
      format: "DOUBLES",
      status: "FULL",
    });
    const accepted = [];
    for (let i = 0; i < 3; i++) {
      const player = await createPlayer();
      const join = await createJoin(offer.id, player.id, {
        status: "ACCEPTED",
      });
      accepted.push({ player, join });
    }
    const waiting = await createPlayer();
    await db.offerWaitlist.create({
      data: { offerId: offer.id, userId: waiting.id },
    });

    const outcomes = await Promise.all(
      accepted
        .slice(0, 2)
        .map(({ player, join }) =>
          runAs(player.id, () => withdrawJoin(join.id)),
        ),
    );

    expect(outcomes).toEqual([{ ok: true }, { ok: true }]);
    const after = await db.sparringOffer.findUniqueOrThrow({
      where: { id: offer.id },
      select: {
        status: true,
        joins: { where: { userId: waiting.id }, select: { status: true } },
        waitlist: true,
      },
    });
    expect(after).toEqual({
      status: "OPEN",
      joins: [{ status: "REQUESTED" }],
      waitlist: [],
    });
  });
});

describe("requestToJoin", () => {
  it("makes one request and one welcome message out of a double click", async () => {
    const author = await createPlayer();
    const player = await createPlayer();
    const offer = await createOffer(author.id);

    const outcomes = await Promise.all([
      runAs(player.id, () => requestToJoin(offer.id)),
      runAs(player.id, () => requestToJoin(offer.id)),
    ]);

    expect(outcomes).toContainEqual({ ok: true });
    expect(outcomes).toContainEqual({
      ok: false,
      message: "You have already asked to join.",
    });
    const joins = await db.offerJoin.findMany({
      where: { offerId: offer.id },
      select: { userId: true, status: true, messages: true },
    });
    expect(joins).toHaveLength(1);
    expect(joins[0]).toMatchObject({ userId: player.id, status: "REQUESTED" });
    expect(joins[0]?.messages).toHaveLength(1);
    expect(joins[0]?.messages[0]).toMatchObject({
      type: "SYSTEM",
      senderId: null,
      content: "THREAD_WELCOME",
    });
  });

  it("stays one request under a burst of five", async () => {
    const author = await createPlayer();
    const player = await createPlayer();
    const offer = await createOffer(author.id);

    const outcomes = await Promise.all(
      Array.from({ length: 5 }, () =>
        runAs(player.id, () => requestToJoin(offer.id)),
      ),
    );

    expect(outcomes.filter((outcome) => outcome.ok)).toHaveLength(1);
    expect(await db.offerJoin.count({ where: { offerId: offer.id } })).toBe(1);
    expect(
      await db.message.count({ where: { offerJoin: { offerId: offer.id } } }),
    ).toBe(1);
  });
});
