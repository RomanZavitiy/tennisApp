-- Offer fields (task 3.2; model in decisions.md, task 3.1). Additive only:
-- a new enum and columns, nothing dropped or renamed.

-- CreateEnum
CREATE TYPE "offer_format" AS ENUM ('SINGLES', 'DOUBLES');

-- AlterTable. starts_at is added nullable first: existing rows (the seed
-- offer) get a value below, then the column becomes NOT NULL.
ALTER TABLE "sparring_offers" ADD COLUMN     "comment" VARCHAR(500),
ADD COLUMN     "district" "district",
ADD COLUMN     "format" "offer_format" NOT NULL DEFAULT 'SINGLES',
ADD COLUMN     "has_partner" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ntrp_max" DOUBLE PRECISION,
ADD COLUMN     "ntrp_min" DOUBLE PRECISION,
ADD COLUMN     "starts_at" TIMESTAMPTZ,
ADD COLUMN     "surface" "surface";

-- Existing offers: the start time is unknown, so use the creation time — the
-- offer counts as past and drops out of the feed. An offer without a club
-- takes its author's district, so the place check below holds.
UPDATE "sparring_offers" SET "starts_at" = "created_at";
UPDATE "sparring_offers" AS o
  SET "district" = COALESCE(u."district", 'STARE_MIASTO')
  FROM "users" AS u
  WHERE u."id" = o."author_id" AND o."club_id" IS NULL AND o."district" IS NULL;

ALTER TABLE "sparring_offers" ALTER COLUMN "starts_at" SET NOT NULL;

-- CreateIndex
CREATE INDEX "sparring_offers_status_starts_at_idx" ON "sparring_offers"("status", "starts_at");

-- Hand-written checks, which Prisma's schema can't express. The offer schema
-- (task 3.3) validates first, including rules that depend on the current
-- time (start in the future), which a CHECK can't hold.

-- "I already have a partner" exists only for doubles.
ALTER TABLE "sparring_offers" ADD CONSTRAINT "sparring_offers_partner_doubles_check"
  CHECK (NOT "has_partner" OR "format" = 'DOUBLES');

-- An offer says where: a club, a district, or both.
ALTER TABLE "sparring_offers" ADD CONSTRAINT "sparring_offers_place_check"
  CHECK ("club_id" IS NOT NULL OR "district" IS NOT NULL);

-- NTRP bounds: the profile's scale, 1.5–7.0 in steps of 0.5, min ≤ max.
ALTER TABLE "sparring_offers" ADD CONSTRAINT "sparring_offers_ntrp_min_check"
  CHECK ("ntrp_min" BETWEEN 1.5 AND 7.0
         AND "ntrp_min" * 2 = trunc("ntrp_min" * 2));
ALTER TABLE "sparring_offers" ADD CONSTRAINT "sparring_offers_ntrp_max_check"
  CHECK ("ntrp_max" BETWEEN 1.5 AND 7.0
         AND "ntrp_max" * 2 = trunc("ntrp_max" * 2));
ALTER TABLE "sparring_offers" ADD CONSTRAINT "sparring_offers_ntrp_range_check"
  CHECK ("ntrp_min" <= "ntrp_max");

-- A comment, when set, isn't just spaces.
ALTER TABLE "sparring_offers" ADD CONSTRAINT "sparring_offers_comment_not_blank_check"
  CHECK (btrim("comment") <> '');
