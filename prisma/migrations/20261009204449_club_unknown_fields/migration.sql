-- Club fields the owner's data needs (task 2.11). Additive only: new enum
-- values, two columns that may now be empty, and a looser surfaces check.
-- Nothing is dropped or renamed, and every existing row stays valid.

-- AlterEnum: some courts in a hall all year, the rest outdoor.
ALTER TYPE "indoor_courts" ADD VALUE 'PARTIAL' BEFORE 'YEAR_ROUND';

-- AlterEnum: synthetic clay (sztuczna mączka).
ALTER TYPE "surface" ADD VALUE 'ARTIFICIAL_CLAY' BEFORE 'HARD';

-- AlterTable: no district for clubs just outside the city limits; no
-- indoor value while it's unknown.
ALTER TABLE "clubs" ALTER COLUMN "district" DROP NOT NULL,
ALTER COLUMN "indoor" DROP NOT NULL;

-- Surfaces may be an empty list while unknown, but the column is still never
-- NULL and holds no empty entries.
ALTER TABLE "clubs" DROP CONSTRAINT "clubs_surfaces_check";
ALTER TABLE "clubs" ADD CONSTRAINT "clubs_surfaces_check"
  CHECK ("surfaces" IS NOT NULL
         AND array_position("surfaces", NULL) IS NULL);
