-- Offer duration (slice K5): how long the players want the court for, so
-- the feed can show "18:00–19:30" and filter by it. Additive only
-- (AGENTS.md §6) -- one column with a default, so existing offers read as
-- the usual 90 minutes.

-- AlterTable
ALTER TABLE "sparring_offers" ADD COLUMN     "duration_minutes" INTEGER NOT NULL DEFAULT 90;


-- The options the form offers; the offer schema (lib/validation/offer.ts)
-- checks the same list first.
ALTER TABLE "sparring_offers" ADD CONSTRAINT "sparring_offers_duration_minutes_check"
  CHECK ("duration_minutes" IN (60, 90, 120, 180));
