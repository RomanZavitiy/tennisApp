-- Slice PD2 (docs/PADEL-PLAN.md, PD2.3): "Looking for a game" posts get a
-- sport. Additive: every existing row becomes tennis through the default.

-- AlterTable
ALTER TABLE "play_intents" ADD COLUMN "sport" "sport" NOT NULL DEFAULT 'TENNIS';

-- One intent per day per player *and sport*: a player can look for a tennis
-- and a padel game on the same day. The old index is replaced by a wider
-- one; no row is touched, and every existing (user, date) pair stays unique
-- because all of them are tennis.
DROP INDEX "play_intents_user_id_date_key";
CREATE UNIQUE INDEX "play_intents_user_id_sport_date_key" ON "play_intents"("user_id", "sport", "date");

-- Hand-written check, which Prisma's schema can't express: padel is always
-- two against two, same rule as sparring_offers_padel_doubles_check.
ALTER TABLE "play_intents" ADD CONSTRAINT "play_intents_padel_doubles_check"
  CHECK ("sport" <> 'PADEL' OR "format" = 'DOUBLES');
