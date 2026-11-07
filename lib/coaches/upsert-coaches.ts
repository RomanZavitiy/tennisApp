import type { Prisma } from "@/lib/generated/prisma/client";
import type { CoachRecord } from "@/lib/validation/coach";

/**
 * Writes checked coach records, matching rows by slug: a new slug adds a
 * coach, a known one updates every field in place, so the coach keeps its
 * id. Coaches missing from the file are left alone — removing one is a
 * deliberate step, same reasoning as upsertClubs.
 *
 * Every coach's club links are replaced, not appended: the file is the full
 * picture of where a coach teaches today, the same rule upsertClubs applies
 * to a club's courts. A club slug the file names that doesn't match a
 * loaded club is rejected — the whole write throws before anything is
 * written, same "nothing unless everything passes" rule as parseCoachFile.
 */
export async function upsertCoaches(
  tx: Prisma.TransactionClient,
  coaches: CoachRecord[],
): Promise<void> {
  const allSlugs = [...new Set(coaches.flatMap((c) => c.clubSlugs))];
  const clubs = await tx.club.findMany({
    where: { slug: { in: allSlugs } },
    select: { id: true, slug: true },
  });
  const clubIdBySlug = new Map(clubs.map((c) => [c.slug, c.id]));
  const unknownSlugs = allSlugs.filter((slug) => !clubIdBySlug.has(slug));
  if (unknownSlugs.length > 0) {
    throw new Error(
      `Unknown club slug(s) in coach data: ${unknownSlugs.join(", ")}`,
    );
  }

  for (const coach of coaches) {
    // Every column by name; the file-only source stays out.
    const data = {
      slug: coach.slug,
      name: coach.name,
      bio: coach.bio,
      district: coach.district,
      levels: coach.levels,
      languages: coach.languages,
      priceInfo: coach.priceInfo,
      phone: coach.phone,
      websiteUrl: coach.websiteUrl,
      verifiedAt: new Date(`${coach.verifiedAt}T00:00:00Z`),
    };
    const clubConnections = coach.clubSlugs.map((slug) => {
      const id = clubIdBySlug.get(slug);
      if (!id) throw new Error(`Unknown club slug: ${slug}`);
      return { id };
    });

    await tx.coach.upsert({
      where: { slug: coach.slug },
      create: { ...data, clubs: { connect: clubConnections } },
      update: { ...data, clubs: { set: clubConnections } },
    });
  }
}
