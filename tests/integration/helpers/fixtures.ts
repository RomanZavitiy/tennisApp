import { randomUUID } from "node:crypto";

import { db } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import { CURRENT_CONSENT_VERSION } from "@/lib/legal/consent";

// Rows for one test. Every helper makes new ones with random ids and slugs,
// so tests never share data and can run in any order, on a database that
// still holds rows from earlier runs.

const HOUR_MS = 3_600_000;

export function hoursFromNow(hours: number): Date {
  return new Date(Date.now() + hours * HOUR_MS);
}

export const STARTING_ELO = 1500;

/** An onboarded player who has agreed to the current terms. */
export function createPlayer(
  overrides: Partial<Prisma.UserUncheckedCreateInput> = {},
) {
  const id = randomUUID();
  return db.user.create({
    data: {
      id,
      email: `${id}@example.test`,
      name: "Test Player",
      birthDate: new Date("1990-05-17"),
      gender: "FEMALE",
      district: "KROWODRZA",
      selfRatedNtrp: 3.5,
      elo: STARTING_ELO,
      onboardingCompletedAt: new Date(),
      consentedAt: new Date(),
      consentVersion: CURRENT_CONSENT_VERSION,
      ...overrides,
    },
  });
}

/** A singles offer three days out, unless overridden. */
export function createOffer(
  authorId: string,
  overrides: Partial<Prisma.SparringOfferUncheckedCreateInput> = {},
) {
  return db.sparringOffer.create({
    data: {
      authorId,
      district: "KROWODRZA",
      startsAt: hoursFromNow(72),
      ...overrides,
    },
  });
}

export function createJoin(
  offerId: string,
  userId: string,
  overrides: Partial<Prisma.OfferJoinUncheckedCreateInput> = {},
) {
  return db.offerJoin.create({ data: { offerId, userId, ...overrides } });
}

/**
 * A singles match that has already been played: author, player, a FULL
 * offer that started yesterday and the player's ACCEPTED join -- the state
 * a result can be filed for.
 */
export async function createPlayedMatch() {
  const author = await createPlayer({ name: "Author" });
  const player = await createPlayer({ name: "Player" });
  const offer = await createOffer(author.id, {
    status: "FULL",
    startsAt: hoursFromNow(-24),
  });
  const join = await createJoin(offer.id, player.id, { status: "ACCEPTED" });
  return { author, player, offer, join };
}

/** A partner club (bookingMode SPINBUDDY), open 06:00-23:00 every day, with one court. */
export async function createBookableClub() {
  const club = await db.club.create({
    data: {
      slug: `test-club-${randomUUID()}`,
      name: "Test Club",
      address: "ul. Testowa 1, Kraków",
      latitude: 50.06,
      longitude: 19.94,
      courtCount: 1,
      surfaces: ["CLAY"],
      bookingMode: "SPINBUDDY",
      verifiedAt: new Date("2026-10-01"),
      courtHours: {
        create: [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
          weekday,
          opensAt: 6 * 60,
          closesAt: 23 * 60,
        })),
      },
    },
  });
  const court = await db.court.create({
    data: { clubId: club.id, name: "Court 1", surface: "CLAY" },
  });
  return { club, court };
}
