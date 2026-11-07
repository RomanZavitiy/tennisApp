-- Post-match feedback + achievements (slice W, owner decision 2026-11-07).
-- Additive only (AGENTS.md §6): two new enums, one new table; achievements
-- are computed from existing counters/match_results, no schema change for
-- them. Applied directly, same workaround as every migration since 3.15
-- (decision 2026-10-14) -- prisma migrate dev still can't replay the
-- history past auth.uid() on a shadow database without the auth schema.

-- CreateEnum
CREATE TYPE "feedback_tag" AS ENUM ('PUNCTUAL', 'LEVEL_MATCHES_NTRP', 'GOOD_GAME');

-- CreateEnum
CREATE TYPE "level_signal" AS ENUM ('HIGHER', 'LOWER');

-- CreateTable
CREATE TABLE "match_feedback" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "match_result_id" UUID NOT NULL,
    "giver_id" UUID NOT NULL,
    "receiver_id" UUID NOT NULL,
    "tags" "feedback_tag"[] NOT NULL DEFAULT ARRAY[]::"feedback_tag"[],
    "level_signal" "level_signal",

    CONSTRAINT "match_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: one feedback row per giver per match -- same reasoning as
-- match_results' own unique offer_join_id, but keyed by giver since a
-- match has two possible givers.
CREATE UNIQUE INDEX "match_feedback_match_result_id_giver_id_key" ON "match_feedback"("match_result_id", "giver_id");

-- CreateIndex: the badge/hint aggregate's own query shape -- every
-- feedback a player has received.
CREATE INDEX "match_feedback_receiver_id_idx" ON "match_feedback"("receiver_id");

-- AddForeignKey: feedback goes away with its match or with either side of it.
ALTER TABLE "match_feedback" ADD CONSTRAINT "match_feedback_match_result_id_fkey" FOREIGN KEY ("match_result_id") REFERENCES "match_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "match_feedback" ADD CONSTRAINT "match_feedback_giver_id_fkey" FOREIGN KEY ("giver_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "match_feedback" ADD CONSTRAINT "match_feedback_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- At most 3 tags (there are only 3 possible values), no NULL entries --
-- the form only ever offers the 3 known checkboxes, but this keeps
-- obviously-bad data out even if a write skips that path (same discipline
-- as coaches_levels_check). Postgres CHECK constraints can't use a
-- subquery, so de-duplication is the Zod schema's job
-- (lib/validation/match-feedback.ts), not this CHECK's.
ALTER TABLE "match_feedback" ADD CONSTRAINT "match_feedback_tags_check"
  CHECK ("tags" IS NOT NULL
         AND cardinality("tags") <= 3
         AND array_position("tags", NULL) IS NULL);

-- A new table must enable RLS in the same migration (rule from the
-- 2026-09-29 migration). No policy at all, same as offer_dismissals/
-- user_blocks: feedback is never shown to anyone, individually or by
-- attribution (owner decision 2026-11-07) -- only the server (Prisma, 1.2)
-- ever reads or writes this table, and only to compute an aggregate.
ALTER TABLE "match_feedback" ENABLE ROW LEVEL SECURITY;
