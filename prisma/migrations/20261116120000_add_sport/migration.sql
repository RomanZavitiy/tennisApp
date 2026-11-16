-- Slice PD1 (docs/PADEL-PLAN.md): padel as a second sport. Additive only:
-- every existing row becomes tennis through the column defaults.

-- CreateEnum
CREATE TYPE "sport" AS ENUM ('TENNIS', 'PADEL');

-- CreateEnum
CREATE TYPE "padel_side" AS ENUM ('LEFT', 'RIGHT', 'BOTH');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "padel_level" DOUBLE PRECISION,
ADD COLUMN "padel_side" "padel_side";

-- AlterTable
ALTER TABLE "clubs" ADD COLUMN "sports" "sport"[] DEFAULT ARRAY['TENNIS']::"sport"[];

-- AlterTable
ALTER TABLE "sparring_offers" ADD COLUMN "sport" "sport" NOT NULL DEFAULT 'TENNIS';

-- Hand-written checks, which Prisma's schema can't express.

-- The padel scale: 1.0–7.0 in steps of 0.5.
ALTER TABLE "users" ADD CONSTRAINT "users_padel_level_check"
  CHECK ("padel_level" BETWEEN 1.0 AND 7.0
         AND "padel_level" * 2 = trunc("padel_level" * 2));

-- A club offers at least one sport.
ALTER TABLE "clubs" ADD CONSTRAINT "clubs_sports_not_empty_check"
  CHECK (cardinality("sports") > 0);

-- Padel is always two against two.
ALTER TABLE "sparring_offers" ADD CONSTRAINT "sparring_offers_padel_doubles_check"
  CHECK ("sport" <> 'PADEL' OR "format" = 'DOUBLES');

-- The level bounds now depend on the sport: tennis keeps NTRP 1.5–7.0, padel
-- starts at 1.0. Replaces the two checks from 20261011153803_add_offer_fields
-- (a constraint is dropped and re-added, no data is touched: every existing
-- row is tennis and already satisfies the tennis branch).
ALTER TABLE "sparring_offers" DROP CONSTRAINT "sparring_offers_ntrp_min_check";
ALTER TABLE "sparring_offers" ADD CONSTRAINT "sparring_offers_ntrp_min_check"
  CHECK ("ntrp_min" BETWEEN (CASE WHEN "sport" = 'PADEL' THEN 1.0 ELSE 1.5 END) AND 7.0
         AND "ntrp_min" * 2 = trunc("ntrp_min" * 2));
ALTER TABLE "sparring_offers" DROP CONSTRAINT "sparring_offers_ntrp_max_check";
ALTER TABLE "sparring_offers" ADD CONSTRAINT "sparring_offers_ntrp_max_check"
  CHECK ("ntrp_max" BETWEEN (CASE WHEN "sport" = 'PADEL' THEN 1.0 ELSE 1.5 END) AND 7.0
         AND "ntrp_max" * 2 = trunc("ntrp_max" * 2));
