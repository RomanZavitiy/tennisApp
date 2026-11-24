import type { Gender, MatchGender } from "@/lib/generated/prisma/enums";

// Who a game is for (slice PD3, task PD3.1): anyone, men, women, or mixed
// doubles. Pure rules, shared by the join / waitlist / invite checks and by
// every query that suggests a game to a player (pushes, candidates, "play
// today"). MIXED is a label for the players to honour — who ends up in which
// pair isn't modelled, so nobody is refused by it; it only exists for
// doubles (CHECK in the migration, and offerSchema).

export const MATCH_GENDERS = [
  "ANY",
  "MEN",
  "WOMEN",
  "MIXED",
] as const satisfies readonly MatchGender[];

/** The one gender a game is limited to, or null when it takes anyone. */
export function requiredGender(matchGender: MatchGender): Gender | null {
  if (matchGender === "MEN") return "MALE";
  if (matchGender === "WOMEN") return "FEMALE";
  return null;
}

/** Whether a player of `gender` may play in a `matchGender` game. A player
 * with no gender on file (not onboarded) fits only an unrestricted one. */
export function genderFits(
  matchGender: MatchGender,
  gender: Gender | null | undefined,
): boolean {
  const required = requiredGender(matchGender);
  return required === null || required === gender;
}

/** Every kind of game a player of `gender` may join — for a query's
 * `matchGender: { in: … }`. */
export function matchGendersOpenTo(
  gender: Gender | null | undefined,
): MatchGender[] {
  return MATCH_GENDERS.filter((matchGender) => genderFits(matchGender, gender));
}
