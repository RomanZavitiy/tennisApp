import { z } from "zod";

// A match's score (task 4.5; format decided 2026-10-14): 2 or 3 sets, each
// author's and the joining player's games. The result form (4.6) and the
// submitResult server action both check this, since a request can skip the
// form like everywhere else in this codebase.
//
// A set is 6-0..6-4, 7-5, or a 7-6 tiebreak; the third set only (index 2)
// may instead be a super-tiebreak to 10, won by 2+. A third set only makes
// sense when the first two are split 1-1 — a side that already won both
// doesn't play a third. The declared winner must be whoever actually won
// two sets.

const gamesSchema = z.number("Enter the games won.").int().min(0).max(30);

export const setScoreSchema = z.object({
  author: gamesSchema,
  player: gamesSchema,
});

export type SetScore = z.infer<typeof setScoreSchema>;

type SetOutcome = "AUTHOR" | "PLAYER" | null;

function isValidRegularSet(high: number, low: number): boolean {
  return (high === 6 && low <= 4) || (high === 7 && (low === 5 || low === 6));
}

function isValidSuperTiebreak(high: number, low: number): boolean {
  return high >= 10 && high - low >= 2;
}

function isValidSet(set: SetScore, isThirdSet: boolean): boolean {
  const high = Math.max(set.author, set.player);
  const low = Math.min(set.author, set.player);
  return (
    isValidRegularSet(high, low) ||
    (isThirdSet && isValidSuperTiebreak(high, low))
  );
}

function setOutcome(set: SetScore): SetOutcome {
  if (set.author === set.player) {
    return null;
  }
  return set.author > set.player ? "AUTHOR" : "PLAYER";
}

export const matchScoreSchema = z
  .object({
    sets: z.array(setScoreSchema).min(2).max(3),
    winner: z.enum(["AUTHOR", "PLAYER"], "Choose who won."),
  })
  .superRefine((value, ctx) => {
    const { sets } = value;
    sets.forEach((set, index) => {
      if (!isValidSet(set, index === 2)) {
        ctx.addIssue({
          code: "custom",
          path: ["sets", index],
          message: `Set ${String(index + 1)} isn't a valid score.`,
        });
      }
    });
    if (!sets.every((set, index) => isValidSet(set, index === 2))) {
      return;
    }

    const outcomes = sets.map(setOutcome);
    const authorWins = outcomes.filter(
      (outcome) => outcome === "AUTHOR",
    ).length;
    const playerWins = outcomes.filter(
      (outcome) => outcome === "PLAYER",
    ).length;

    // Reported on "winner", not "sets": these are whole-match problems, not
    // any one set's, and "winner" is always a plain field — unlike "sets",
    // which is itself an array, so a form (4.6) can show them in one place
    // without juggling an error that sometimes belongs to the array and
    // sometimes to one of its items.
    if (sets.length === 2) {
      if (authorWins !== 2 && playerWins !== 2) {
        ctx.addIssue({
          code: "custom",
          path: ["winner"],
          message: "With two sets, the same side must win both.",
        });
        return;
      }
    } else {
      const firstTwoSplit =
        outcomes[0] !== outcomes[1] &&
        outcomes[0] !== null &&
        outcomes[1] !== null;
      if (!firstTwoSplit) {
        ctx.addIssue({
          code: "custom",
          path: ["winner"],
          message: "A third set is only played when the first two are split.",
        });
        return;
      }
    }

    const scoreWinner = authorWins > playerWins ? "AUTHOR" : "PLAYER";
    if (scoreWinner !== value.winner) {
      ctx.addIssue({
        code: "custom",
        path: ["winner"],
        message: "The winner doesn't match the score.",
      });
    }
  });

export type MatchScoreInput = z.input<typeof matchScoreSchema>;
export type MatchScoreValues = z.output<typeof matchScoreSchema>;
