"use server";

import { cookies } from "next/headers";

import { isSport, SPORT_COOKIE, SPORT_COOKIE_MAX_AGE } from "@/lib/sport/sport";

// Called by the header's sport switcher (slice PD1). Only a cookie: which
// sport someone is browsing is a view setting, like the theme, so there is
// nothing to save on the user's row and it works the same for a guest.
export async function setSport(sport: unknown): Promise<void> {
  if (!isSport(sport)) {
    return;
  }
  (await cookies()).set(SPORT_COOKIE, sport, {
    maxAge: SPORT_COOKIE_MAX_AGE,
    sameSite: "lax",
    path: "/",
  });
}
