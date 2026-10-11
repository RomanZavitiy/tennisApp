import { NTRP_LEVELS } from "@/lib/profile/options";

// A new player's ELO, from the NTRP level they chose in their profile (task
// 4.1; the table is an owner decision in decisions.md). Each half step of
// NTRP is 100 points and 4.0 — a solid club player — is 1500, so a gap of
// half a level means the stronger player wins about 64% of the time.

export const STARTING_ELO: Readonly<Record<string, number>> = {
  "1.5": 1000,
  "2.0": 1100,
  "2.5": 1200,
  "3.0": 1300,
  "3.5": 1400,
  "4.0": 1500,
  "4.5": 1600,
  "5.0": 1700,
  "5.5": 1800,
  "6.0": 1900,
  "6.5": 2000,
  "7.0": 2100,
};

/**
 * The starting ELO for a self-rated NTRP level. Throws for a level off the
 * profile's scale: the profile schema and a database CHECK (1.10) only allow
 * the scale, so another value is a bug to surface, not a rating to guess.
 */
export function startingElo(ntrp: number): number {
  const elo = NTRP_LEVELS.includes(ntrp)
    ? STARTING_ELO[ntrp.toFixed(1)]
    : undefined;
  if (elo === undefined) {
    throw new RangeError(`NTRP ${String(ntrp)} is not on the 1.5–7.0 scale.`);
  }
  return elo;
}
