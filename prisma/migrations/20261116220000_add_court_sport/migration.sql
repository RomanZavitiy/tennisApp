-- Slice PD2 (docs/PADEL-PLAN.md, PD2.8): a court belongs to one sport, so a
-- partner club with both can show a tennis grid and a padel grid. Additive:
-- every existing court becomes tennis through the default.

-- AlterTable
ALTER TABLE "courts" ADD COLUMN "sport" "sport" NOT NULL DEFAULT 'TENNIS';
