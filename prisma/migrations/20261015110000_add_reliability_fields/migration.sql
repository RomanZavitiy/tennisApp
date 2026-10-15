-- Reliability (tasks 4.10-4.12, decision 2026-10-14 "Надійність гравця").
-- Additive except for loosening two NOT NULLs (safe: a no-show report
-- simply has no score) -- same "add nullable, never drop or rename" shape
-- as every other migration here (AGENTS.md §6).

-- AlterTable: three counters on users, the same shape matches_played (4.2)
-- already is. They're counters, not a query, because offer_joins only
-- keeps a join's *current* status -- once an accepted join is later
-- withdrawn, or its offer cancelled, nothing says it was ever accepted --
-- and no history table records a late cancellation at all.
ALTER TABLE "users"
  ADD COLUMN "scheduled_matches" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "no_shows" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "late_cancellations" INTEGER NOT NULL DEFAULT 0;

-- AlterTable: a no-show report (4.10) is a match_results row with no score
-- at all -- score/winner become nullable, and no_show_party (the mirror of
-- reported_by: who is being reported, not who filed) is new.
ALTER TABLE "match_results"
  ALTER COLUMN "score" DROP NOT NULL,
  ALTER COLUMN "winner" DROP NOT NULL,
  ADD COLUMN "no_show_party" "match_party";

-- Replaces the 4.4 shape check: exactly one of "a scored report" (score +
-- winner) or "a no-show report" (no_show_party) per row, never both or
-- neither.
ALTER TABLE "match_results" DROP CONSTRAINT "match_results_score_shape_check";
ALTER TABLE "match_results" ADD CONSTRAINT "match_results_score_shape_check"
  CHECK (
    CASE
      WHEN "no_show_party" IS NOT NULL THEN "score" IS NULL AND "winner" IS NULL
      ELSE "score" IS NOT NULL AND "winner" IS NOT NULL
        AND jsonb_typeof("score") = 'array' AND jsonb_array_length("score") BETWEEN 2 AND 3
    END
  );

-- A no-show report only ever settles as NO_SHOW or DISPUTED (4.10) -- never
-- CONFIRMED, since ELO doesn't move for one (decision 2026-10-14).
-- match_results_elo_with_confirmed_check (4.4) already forces CONFIRMED to
-- carry ELO snapshots a no-show path never writes, so this only catches
-- status reaching NO_SHOW without the party that explains it.
ALTER TABLE "match_results" ADD CONSTRAINT "match_results_no_show_status_check"
  CHECK ("status" <> 'NO_SHOW' OR "no_show_party" IS NOT NULL);
