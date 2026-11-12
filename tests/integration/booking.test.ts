import { describe, expect, it } from "vitest";

import { requestBooking } from "@/app/clubs/[id]/book/actions";
import { isExclusionViolation } from "@/lib/booking/db-errors";
import { db } from "@/lib/db";
import type { BookingStatus } from "@/lib/generated/prisma/enums";
import { toKrakowLocal } from "@/lib/offers/krakow-time";
import { expectDbRejection, PG } from "@/tests/integration/helpers/db-errors";
import {
  createBookableClub,
  createPlayer,
  hoursFromNow,
} from "@/tests/integration/helpers/fixtures";
import { redirectOrResult } from "@/tests/integration/helpers/next";
import { runAs } from "@/tests/integration/helpers/session";

// "No double-booking" lives in Postgres (decision 2026-10-21): the EXCLUDE
// constraints on bookings and court_blocks, hand-written in the migration.

/** 10:00-11:00 UTC three days from now, shifted by `fromHour`/`toHour`. */
function slot(fromHour: number, toHour: number) {
  const day = hoursFromNow(72);
  day.setUTCHours(0, 0, 0, 0);
  return {
    startsAt: new Date(day.getTime() + fromHour * 3_600_000),
    endsAt: new Date(day.getTime() + toHour * 3_600_000),
  };
}

async function courtAndPlayers() {
  const { club, court } = await createBookableClub();
  const first = await createPlayer();
  const second = await createPlayer();
  return { club, court, first, second };
}

describe("bookings_no_overlap_excl", () => {
  it.each<[BookingStatus, BookingStatus]>([
    ["PENDING", "PENDING"],
    ["PENDING", "CONFIRMED"],
    ["CONFIRMED", "PENDING"],
    ["CONFIRMED", "CONFIRMED"],
  ])(
    "refuses a %s booking overlapping a %s one on the same court",
    async (existing, incoming) => {
      const { court, first, second } = await courtAndPlayers();
      await db.booking.create({
        data: {
          courtId: court.id,
          userId: first.id,
          status: existing,
          ...slot(10, 12),
        },
      });

      const overlapping = db.booking.create({
        data: {
          courtId: court.id,
          userId: second.id,
          status: incoming,
          ...slot(11, 13),
        },
      });
      await expectDbRejection(overlapping, {
        code: PG.exclusionViolation,
        mentions: "bookings_no_overlap_excl",
      });
    },
  );

  it("is the error the app's isExclusionViolation() recognises", async () => {
    const { court, first, second } = await courtAndPlayers();
    await db.booking.create({
      data: { courtId: court.id, userId: first.id, ...slot(10, 12) },
    });
    const error: unknown = await db.booking
      .create({
        data: { courtId: court.id, userId: second.id, ...slot(10, 12) },
      })
      .catch((caught: unknown) => caught);
    expect(isExclusionViolation(error)).toBe(true);
  });

  it.each<BookingStatus>(["CANCELLED", "DECLINED"])(
    "lets a new booking take the slot of a %s one",
    async (status) => {
      const { court, first, second } = await courtAndPlayers();
      await db.booking.create({
        data: { courtId: court.id, userId: first.id, status, ...slot(10, 12) },
      });
      const booking = await db.booking.create({
        data: { courtId: court.id, userId: second.id, ...slot(10, 12) },
      });
      expect(booking.status).toBe("PENDING");
    },
  );

  it("frees the slot when the booking holding it is cancelled", async () => {
    const { court, first, second } = await courtAndPlayers();
    const held = await db.booking.create({
      data: { courtId: court.id, userId: first.id, ...slot(10, 12) },
    });
    await db.booking.update({
      where: { id: held.id },
      data: { status: "CANCELLED" },
    });
    await db.booking.create({
      data: { courtId: court.id, userId: second.id, ...slot(10, 12) },
    });
    // ...and the cancelled one can't come back on top of it.
    await expectDbRejection(
      db.booking.update({
        where: { id: held.id },
        data: { status: "PENDING" },
      }),
      { code: PG.exclusionViolation, mentions: "bookings_no_overlap_excl" },
    );
  });

  it("allows back-to-back bookings (one ends when the next starts)", async () => {
    const { court, first, second } = await courtAndPlayers();
    await db.booking.create({
      data: { courtId: court.id, userId: first.id, ...slot(10, 11) },
    });
    await db.booking.create({
      data: { courtId: court.id, userId: second.id, ...slot(11, 12) },
    });
    await db.booking.create({
      data: { courtId: court.id, userId: second.id, ...slot(9, 10) },
    });
    expect(await db.booking.count({ where: { courtId: court.id } })).toBe(3);
  });

  it("allows the same time on another court", async () => {
    const { club, court, first, second } = await courtAndPlayers();
    const otherCourt = await db.court.create({
      data: { clubId: club.id, name: "Court 2", surface: "HARD" },
    });
    await db.booking.create({
      data: { courtId: court.id, userId: first.id, ...slot(10, 12) },
    });
    await db.booking.create({
      data: { courtId: otherCourt.id, userId: second.id, ...slot(10, 12) },
    });
  });

  it("lets exactly one of two simultaneous inserts for the same slot through", async () => {
    const { court, first, second } = await courtAndPlayers();
    const outcomes = await Promise.allSettled(
      [first, second].map((player) =>
        db.booking.create({
          data: { courtId: court.id, userId: player.id, ...slot(10, 12) },
        }),
      ),
    );
    expect(outcomes.map((o) => o.status).sort()).toEqual([
      "fulfilled",
      "rejected",
    ]);
    expect(await db.booking.count({ where: { courtId: court.id } })).toBe(1);
  });
});

describe("court_blocks_no_overlap_excl", () => {
  it("refuses overlapping blocks, allows adjacent ones", async () => {
    const { court, first } = await courtAndPlayers();
    const block = { courtId: court.id, createdById: first.id };
    await db.courtBlock.create({ data: { ...block, ...slot(10, 12) } });

    await expectDbRejection(
      db.courtBlock.create({ data: { ...block, ...slot(11, 13) } }),
      { code: PG.exclusionViolation, mentions: "court_blocks_no_overlap_excl" },
    );
    await db.courtBlock.create({ data: { ...block, ...slot(12, 13) } });
  });
});

// Booking-vs-block is deliberately not a constraint (see the migration): the
// server action re-reads the day's grid right before writing.
describe("requestBooking", () => {
  /** The form's values for a one-hour request at this instant. */
  function requestFor(courtId: string, startsAt: Date) {
    return { courtId, startsAt: toKrakowLocal(startsAt), duration: 60 };
  }

  it("books a free slot", async () => {
    const { court, first } = await courtAndPlayers();
    const { startsAt, endsAt } = slot(10, 11);

    const outcome = await redirectOrResult(
      runAs(first.id, () => requestBooking(requestFor(court.id, startsAt))),
    );

    expect(outcome).toEqual({ redirectedTo: "/profile" });
    const booking = await db.booking.findFirstOrThrow({
      where: { courtId: court.id },
    });
    expect(booking).toMatchObject({
      userId: first.id,
      status: "PENDING",
      startsAt,
      endsAt,
    });
  });

  it("refuses a slot that a court block covers", async () => {
    const { court, first, second } = await courtAndPlayers();
    await db.courtBlock.create({
      data: { courtId: court.id, createdById: first.id, ...slot(10, 12) },
    });

    const outcome = await redirectOrResult(
      runAs(second.id, () =>
        requestBooking(requestFor(court.id, slot(11, 12).startsAt)),
      ),
    );

    expect(outcome).toEqual({
      ok: false,
      message: "That slot was just taken. Pick another time.",
    });
    expect(await db.booking.count({ where: { courtId: court.id } })).toBe(0);
  });

  it("gives the slot to exactly one of two players asking at the same moment", async () => {
    const { court, first, second } = await courtAndPlayers();
    const { startsAt } = slot(10, 11);

    const outcomes = await Promise.all(
      [first, second].map((player) =>
        redirectOrResult(
          runAs(player.id, () =>
            requestBooking(requestFor(court.id, startsAt)),
          ),
        ),
      ),
    );

    expect(outcomes).toContainEqual({ redirectedTo: "/profile" });
    expect(outcomes).toContainEqual({
      ok: false,
      message: "That slot was just taken. Pick another time.",
    });
    expect(await db.booking.count({ where: { courtId: court.id } })).toBe(1);
  });
});
