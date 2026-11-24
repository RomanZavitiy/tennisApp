-- Slice PD3 (docs/PADEL-PLAN.md, PD3.2): a private game is reached only
-- through its link. Additive: every existing offer stays PUBLIC through the
-- default. No RLS change: sparring_offers is read on the server only.

-- CreateEnum
CREATE TYPE "offer_visibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- AlterTable
ALTER TABLE "sparring_offers" ADD COLUMN "visibility" "offer_visibility" NOT NULL DEFAULT 'PUBLIC';
