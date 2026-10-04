import type { ReactNode } from "react";

import { requireOnboardedUser } from "@/lib/auth/require-onboarded-user";

// Pages for signed-in players with a finished profile. The proxy has already
// sent signed-out visitors to /login; this sends players without a profile to
// /onboarding. Every page that needs a signed-in user belongs in this group
// (the parentheses keep "(member)" out of the URL) — a page outside it skips
// the onboarding check. /onboarding itself stays outside, or it would
// redirect to itself.
export default async function MemberLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireOnboardedUser();
  return children;
}
