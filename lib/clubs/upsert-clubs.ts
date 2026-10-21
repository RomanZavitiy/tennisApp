import type { Prisma } from "@/lib/generated/prisma/client";
import { minutesFromHHMM, type ClubRecord } from "@/lib/validation/club";

/**
 * Writes checked club records, matching rows by slug: a new slug adds a club,
 * a known one updates every field in place, so the club keeps its id (and
 * with it /clubs/[id] links and offers). Clubs missing from the file are left
 * alone — removing one is a deliberate step, and offers may point at it.
 *
 * Courts and hours (slice K) follow the same "file is the full picture"
 * rule: a declared court is upserted by (clubSlug, name); one the file no
 * longer declares becomes `active: false` rather than deleted, since a
 * Booking or CourtBlock may point at it. Hours have no booking history to
 * protect, so a weekday the file drops is deleted outright.
 */
export async function upsertClubs(
  tx: Prisma.TransactionClient,
  clubs: ClubRecord[],
): Promise<void> {
  for (const club of clubs) {
    // Every column by name; the file-only source and todo stay out.
    const data = {
      slug: club.slug,
      name: club.name,
      address: club.address,
      district: club.district,
      latitude: club.latitude,
      longitude: club.longitude,
      courtCount: club.courtCount,
      surfaces: club.surfaces,
      indoor: club.indoor,
      priceInfo: club.priceInfo,
      phone: club.phone,
      websiteUrl: club.websiteUrl,
      bookingUrl: club.bookingUrl,
      bookingMode: club.bookingMode,
      verifiedAt: new Date(`${club.verifiedAt}T00:00:00Z`),
    };
    const row = await tx.club.upsert({
      where: { slug: club.slug },
      create: data,
      update: data,
    });

    for (const court of club.courts) {
      await tx.court.upsert({
        where: { clubId_name: { clubId: row.id, name: court.name } },
        create: {
          clubId: row.id,
          name: court.name,
          surface: court.surface,
          indoor: court.indoor,
          pricePerHourPln: court.pricePerHourPln ?? null,
        },
        update: {
          surface: court.surface,
          indoor: court.indoor,
          pricePerHourPln: court.pricePerHourPln ?? null,
          active: true,
        },
      });
    }
    await tx.court.updateMany({
      where: {
        clubId: row.id,
        active: true,
        name: { notIn: club.courts.map((c) => c.name) },
      },
      data: { active: false },
    });

    for (const hours of club.hours) {
      await tx.courtHours.upsert({
        where: { clubId_weekday: { clubId: row.id, weekday: hours.weekday } },
        create: {
          clubId: row.id,
          weekday: hours.weekday,
          opensAt: minutesFromHHMM(hours.opens),
          closesAt: minutesFromHHMM(hours.closes),
        },
        update: {
          opensAt: minutesFromHHMM(hours.opens),
          closesAt: minutesFromHHMM(hours.closes),
        },
      });
    }
    await tx.courtHours.deleteMany({
      where: {
        clubId: row.id,
        weekday: { notIn: club.hours.map((h) => h.weekday) },
      },
    });
  }
}
