import { db } from "@/lib/db";
import type { ClubStaffRole } from "@/lib/generated/prisma/enums";

export type LinkClubStaffResult = { ok: true } | { ok: false; message: string };

/**
 * K.19: v1 staff onboarding is owner-run, not self-serve — links an
 * existing player (by email) to a club as OWNER or STAFF. The player must
 * already have signed in once: User.id mirrors auth.users.id, which only
 * Supabase Auth can create, so this can't create the row itself. Safe to
 * run again for the same pair — an upsert, same "matched by a stable key,
 * not re-added" convention as upsertClubs() (K.6).
 */
export async function linkClubStaff(
  email: string,
  clubSlug: string,
  role: ClubStaffRole,
): Promise<LinkClubStaffResult> {
  const user = await db.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!user) {
    return {
      ok: false,
      message: `No user with email "${email}" — they need to sign in at least once first.`,
    };
  }

  const club = await db.club.findUnique({
    where: { slug: clubSlug },
    select: { id: true },
  });
  if (!club) {
    return { ok: false, message: `No club with slug "${clubSlug}".` };
  }

  await db.clubStaff.upsert({
    where: { clubId_userId: { clubId: club.id, userId: user.id } },
    create: { clubId: club.id, userId: user.id, role },
    update: { role },
  });
  return { ok: true };
}
