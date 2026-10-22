import { notFound } from "next/navigation";
import { cache } from "react";

import { getCurrentUser, type SessionUser } from "@/lib/auth/require-user";
import { db } from "@/lib/db";
import type { ClubStaffRole } from "@/lib/generated/prisma/enums";

export type ClubStaffSession = SessionUser & {
  clubId: string;
  role: ClubStaffRole;
};

// /club/[clubId] (K.15): staff are normal users (magic link) — a reviewer
// is "a row in club_staff for this club", not a flag on User, and they
// don't need player onboarding to use the panel. Same 404-for-everyone-
// not-staff shape as requireAdmin (lib/auth/require-admin.ts): a
// signed-out visitor and a signed-in non-staff player look identical, and
// every club-panel server action calls this too, not just the page.
export const requireClubStaff = cache(
  async (clubId: string): Promise<ClubStaffSession> => {
    const user = await getCurrentUser();
    const staff = user
      ? await db.clubStaff.findUnique({
          where: { clubId_userId: { clubId, userId: user.id } },
          select: { role: true },
        })
      : null;

    if (!user || !staff) {
      notFound();
    }
    return { ...user, clubId, role: staff.role };
  },
);
