-- Slice PD4 (docs/PADEL-PLAN.md, decision 2026-11-24): a padel rating of its
-- own, and results for doubles games (padel and tennis). Additive only: two
-- new users columns, one new table, and match_feedback.match_result_id
-- becomes nullable (a feedback row now belongs to a singles result or to a
-- doubles one) -- no column is dropped or renamed.

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "padel_elo" INTEGER,
ADD COLUMN     "padel_matches_played" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "match_feedback" ADD COLUMN     "doubles_result_id" UUID,
ALTER COLUMN "match_result_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "doubles_results" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "status" "match_result_status" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "offer_id" UUID NOT NULL,
    "author_partner_id" UUID,
    "opponent1_id" UUID,
    "opponent2_id" UUID,
    "score" JSONB,
    "winner" "match_party",
    "reported_by_id" UUID NOT NULL,
    "no_show_user_id" UUID,
    "auto_confirm_at" TIMESTAMPTZ NOT NULL,
    "result_reminder_sent_at" TIMESTAMPTZ,
    "elo_changes" JSONB,

    CONSTRAINT "doubles_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "doubles_results_offer_id_key" ON "doubles_results"("offer_id");

-- CreateIndex
CREATE INDEX "doubles_results_author_partner_id_idx" ON "doubles_results"("author_partner_id");

-- CreateIndex
CREATE INDEX "doubles_results_opponent1_id_idx" ON "doubles_results"("opponent1_id");

-- CreateIndex
CREATE INDEX "doubles_results_opponent2_id_idx" ON "doubles_results"("opponent2_id");

-- CreateIndex
CREATE INDEX "doubles_results_reported_by_id_idx" ON "doubles_results"("reported_by_id");

-- CreateIndex
CREATE INDEX "doubles_results_no_show_user_id_idx" ON "doubles_results"("no_show_user_id");

-- CreateIndex
CREATE INDEX "doubles_results_status_auto_confirm_at_idx" ON "doubles_results"("status", "auto_confirm_at");

-- CreateIndex
CREATE UNIQUE INDEX "match_feedback_doubles_result_id_giver_id_receiver_id_key" ON "match_feedback"("doubles_result_id", "giver_id", "receiver_id");

-- AddForeignKey
ALTER TABLE "match_feedback" ADD CONSTRAINT "match_feedback_doubles_result_id_fkey" FOREIGN KEY ("doubles_result_id") REFERENCES "doubles_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doubles_results" ADD CONSTRAINT "doubles_results_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "sparring_offers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doubles_results" ADD CONSTRAINT "doubles_results_author_partner_id_fkey" FOREIGN KEY ("author_partner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doubles_results" ADD CONSTRAINT "doubles_results_opponent1_id_fkey" FOREIGN KEY ("opponent1_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doubles_results" ADD CONSTRAINT "doubles_results_opponent2_id_fkey" FOREIGN KEY ("opponent2_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doubles_results" ADD CONSTRAINT "doubles_results_reported_by_id_fkey" FOREIGN KEY ("reported_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doubles_results" ADD CONSTRAINT "doubles_results_no_show_user_id_fkey" FOREIGN KEY ("no_show_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Hand-written checks --------------------------------------------------------

-- A padel rating is positive, like users.elo.
ALTER TABLE "users" ADD CONSTRAINT "users_padel_elo_check"
  CHECK ("padel_elo" IS NULL OR "padel_elo" > 0);
ALTER TABLE "users" ADD CONSTRAINT "users_padel_matches_played_check"
  CHECK ("padel_matches_played" >= 0);

-- Starting padel ELO for everyone who already declared a padel level
-- (lib/rating/starting-elo.ts, startingPadelElo): 1.0 is 1000, each half
-- level is 100 more, so 7.0 is 2200. Nobody has a confirmed padel result
-- yet, so every one of them is still on the starting value.
UPDATE "users" SET "padel_elo" = 1000 + round(("padel_level" - 1) * 200)::int
  WHERE "padel_level" IS NOT NULL;

-- A feedback row belongs to exactly one result: singles or doubles.
ALTER TABLE "match_feedback" ADD CONSTRAINT "match_feedback_one_result_check"
  CHECK (num_nonnulls("match_result_id", "doubles_result_id") = 1);

-- Either a score -- the other pair both set, a winner and a score, no
-- no-show -- or a no-show report: one player named, nothing else. The
-- author's partner may be null on a score (the author brought their own).
ALTER TABLE "doubles_results" ADD CONSTRAINT "doubles_results_kind_check"
  CHECK (
    ("no_show_user_id" IS NULL
      AND "opponent1_id" IS NOT NULL AND "opponent2_id" IS NOT NULL
      AND "score" IS NOT NULL AND "winner" IS NOT NULL)
    OR
    ("no_show_user_id" IS NOT NULL
      AND "author_partner_id" IS NULL
      AND "opponent1_id" IS NULL AND "opponent2_id" IS NULL
      AND "score" IS NULL AND "winner" IS NULL)
  );

-- Four different people on court: nobody plays on both sides or twice.
ALTER TABLE "doubles_results" ADD CONSTRAINT "doubles_results_distinct_players_check"
  CHECK (
    "opponent1_id" <> "opponent2_id"
    AND ("author_partner_id" IS NULL
         OR ("author_partner_id" <> "opponent1_id"
             AND "author_partner_id" <> "opponent2_id"))
  );

-- A new table must enable RLS in the same migration (rule from the
-- 2026-09-29 migration). No policy, same as match_results: only the server
-- (Prisma, 1.2) reads and writes it -- nothing is opened up for reading.
ALTER TABLE "doubles_results" ENABLE ROW LEVEL SECURITY;
