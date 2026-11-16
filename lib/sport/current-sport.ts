import { cookies } from "next/headers";

import type { Sport } from "@/lib/generated/prisma/enums";
import { SPORT_COOKIE, sportFromCookie } from "@/lib/sport/sport";

/** The sport this request's visitor last picked in the header switcher
 * (slice PD1); tennis until they pick. Server-only: reads the cookie. */
export async function getCurrentSport(): Promise<Sport> {
  return sportFromCookie((await cookies()).get(SPORT_COOKIE)?.value);
}
