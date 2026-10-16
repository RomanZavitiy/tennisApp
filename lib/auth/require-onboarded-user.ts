import { redirect } from "next/navigation";
import { cache } from "react";

import { requireUser } from "@/lib/auth/require-user";
import { db } from "@/lib/db";
import { needsConsent } from "@/lib/legal/consent";

// The signed-in user's profile, or a redirect to /onboarding if they haven't
// filled it in — or to /consent if they have, but haven't agreed to the
// current Terms/Privacy version yet (tasks 6.11, 6.12: every existing user
// sees this once, on their next page load after the version changes). The
// (member) layout calls this for every page in the group, and pages call it
// again for the data; cache() makes that one query per request.
export const requireOnboardedUser = cache(async () => {
  const user = await requireUser();
  const profile = await db.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      birthDate: true,
      gender: true,
      district: true,
      selfRatedNtrp: true,
      onboardingCompletedAt: true,
      avatarPath: true,
      blockedAt: true,
      consentVersion: true,
    },
  });

  // The database CHECK from task 1.10 guarantees every field is set once
  // onboardingCompletedAt is; the explicit checks let TypeScript know too.
  if (
    !profile?.onboardingCompletedAt ||
    !profile.name ||
    !profile.birthDate ||
    !profile.gender ||
    !profile.district ||
    profile.selfRatedNtrp === null
  ) {
    redirect("/onboarding");
  }
  if (needsConsent(profile.consentVersion)) {
    redirect("/consent");
  }

  return {
    id: profile.id,
    name: profile.name,
    birthDate: profile.birthDate,
    gender: profile.gender,
    district: profile.district,
    selfRatedNtrp: profile.selfRatedNtrp,
    avatarPath: profile.avatarPath,
    // Blocked (task 6.4): callers that create offers, join requests or
    // messages check this themselves (lib/moderation/block-rules.ts) — kept
    // here rather than queried again, since every caller already loads the
    // row this comes from.
    blockedAt: profile.blockedAt,
  };
});
