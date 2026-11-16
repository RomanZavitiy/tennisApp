import type { Sport } from "@/lib/generated/prisma/enums";
import { NTRP_LEVELS } from "@/lib/profile/options";

// The two sports (slice PD1, docs/PADEL-PLAN.md). Which one a visitor is
// looking at comes from the SB_SPORT cookie, the same way the language comes
// from NEXT_LOCALE: no route segment, tennis until they switch. No next/*
// imports here, so client components and tests can load it.

export const SPORTS = ["TENNIS", "PADEL"] as const satisfies readonly Sport[];
export const DEFAULT_SPORT: Sport = "TENNIS";
export const SPORT_COOKIE = "SB_SPORT";
export const SPORT_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isSport(value: unknown): value is Sport {
  return (
    typeof value === "string" && (SPORTS as readonly string[]).includes(value)
  );
}

/** The sport a cookie value means; anything unknown is tennis. */
export function sportFromCookie(value: string | null | undefined): Sport {
  return isSport(value) ? value : DEFAULT_SPORT;
}

export const PADEL_LEVEL_MIN = 1;
export const PADEL_LEVEL_MAX = 7;
const LEVEL_STEP = 0.5;

/** 1.0, 1.5, … 7.0 — the same scale the database CHECK enforces. */
export const PADEL_LEVELS = Array.from(
  { length: (PADEL_LEVEL_MAX - PADEL_LEVEL_MIN) / LEVEL_STEP + 1 },
  (_, i) => PADEL_LEVEL_MIN + i * LEVEL_STEP,
);

/** The levels an offer or a filter may name: NTRP for tennis, the padel
 * scale for padel. */
export function levelsFor(sport: Sport): number[] {
  return sport === "PADEL" ? PADEL_LEVELS : NTRP_LEVELS;
}

/** A player's own level in `sport` — what an offer's wanted range is
 * compared against. Null when they never declared one for that sport. */
export function playerLevel(
  player: { selfRatedNtrp: number | null; padelLevel: number | null },
  sport: Sport,
): number | null {
  return sport === "PADEL" ? player.padelLevel : player.selfRatedNtrp;
}
