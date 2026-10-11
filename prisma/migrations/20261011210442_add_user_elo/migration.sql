-- Rating fields (task 4.2). Additive only: two new columns, nothing dropped
-- or renamed.

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "elo" INTEGER,
ADD COLUMN     "matches_played" INTEGER NOT NULL DEFAULT 0;

-- Players who finished onboarding before this migration get their starting
-- ELO from their NTRP. The formula reproduces the owner's table from 4.1
-- (lib/rating/starting-elo.ts): 100 points per half step, 4.0 = 1500.
UPDATE "users"
  SET "elo" = 1500 + round(("self_rated_ntrp" - 4.0) * 200)::integer
  WHERE "onboarding_completed_at" IS NOT NULL;

-- Hand-written checks, which Prisma's schema can't express.

-- A rating is a positive whole number; the match count can't go negative.
ALTER TABLE "users" ADD CONSTRAINT "users_elo_check" CHECK ("elo" > 0);
ALTER TABLE "users" ADD CONSTRAINT "users_matches_played_check"
  CHECK ("matches_played" >= 0);

-- Every onboarded player has a rating: the feed ranks by it (3.8).
ALTER TABLE "users" ADD CONSTRAINT "users_onboarded_elo_check"
  CHECK ("onboarding_completed_at" IS NULL OR "elo" IS NOT NULL);
