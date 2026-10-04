import { z } from "zod";

import { db } from "@/lib/db";
import type { District } from "@/lib/generated/prisma/enums";
import { ageOn, todayInKrakow } from "@/lib/validation/profile";

// What anyone, signed in or not, may see about a player. Prisma bypasses RLS
// (see the RLS decision for task 1.2), so privacy is enforced here: an
// explicit select, and the birth date turned into an age before it leaves
// this function. Email lives only in auth.users and is never read here.

export type PublicProfile = {
  id: string;
  name: string;
  age: number;
  district: District;
  selfRatedNtrp: number;
  avatarPath: string | null;
};

/**
 * The public profile of a player who has finished onboarding, or null — for
 * an id that isn't a UUID, doesn't exist, or belongs to someone who hasn't
 * filled in a profile yet. The page turns null into a 404.
 */
export async function getPublicProfile(
  id: string,
): Promise<PublicProfile | null> {
  // The id comes from the URL; Postgres would throw on a non-UUID.
  if (!z.uuid().safeParse(id).success) {
    return null;
  }

  const row = await db.user.findFirst({
    where: { id, onboardingCompletedAt: { not: null } },
    select: {
      id: true,
      name: true,
      birthDate: true,
      district: true,
      selfRatedNtrp: true,
      avatarPath: true,
    },
  });

  // The database CHECK from task 1.10 guarantees these once onboarded.
  if (
    !row?.name ||
    !row.birthDate ||
    !row.district ||
    row.selfRatedNtrp === null
  ) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    age: ageOn(row.birthDate.toISOString().slice(0, 10), todayInKrakow()),
    district: row.district,
    selfRatedNtrp: row.selfRatedNtrp,
    avatarPath: row.avatarPath,
  };
}
