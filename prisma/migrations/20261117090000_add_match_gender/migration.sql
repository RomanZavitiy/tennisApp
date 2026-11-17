-- Slice PD3 (docs/PADEL-PLAN.md, PD3.1): who a game is for -- anyone, men,
-- women, or mixed doubles. Additive: every existing offer becomes ANY
-- through the default.

-- CreateEnum
CREATE TYPE "match_gender" AS ENUM ('ANY', 'MEN', 'WOMEN', 'MIXED');

-- AlterTable
ALTER TABLE "sparring_offers" ADD COLUMN "match_gender" "match_gender" NOT NULL DEFAULT 'ANY';

-- Hand-written check, which Prisma's schema can't express: "mixed" means
-- mixed pairs, so it only exists for doubles.
ALTER TABLE "sparring_offers" ADD CONSTRAINT "sparring_offers_mixed_doubles_check"
  CHECK ("match_gender" <> 'MIXED' OR "format" = 'DOUBLES');
