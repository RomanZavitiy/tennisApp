import type { Prisma } from "@/lib/generated/prisma/client";
import type { ClubRecord } from "@/lib/validation/club";

/**
 * Writes checked club records, matching rows by slug: a new slug adds a club,
 * a known one updates every field in place, so the club keeps its id (and
 * with it /clubs/[id] links and offers). Clubs missing from the file are left
 * alone — removing one is a deliberate step, and offers may point at it.
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
      verifiedAt: new Date(`${club.verifiedAt}T00:00:00Z`),
    };
    await tx.club.upsert({
      where: { slug: club.slug },
      create: data,
      update: data,
    });
  }
}
