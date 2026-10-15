-- Outbound clicks (task 2.13): a log of clicks on a club's booking link or
-- phone number, from the club's own page or an offer's page. Additive only
-- (AGENTS.md §6) -- a brand new table, nothing existing changes shape.

-- CreateEnum
CREATE TYPE "click_target" AS ENUM ('URL', 'PHONE');

-- CreateTable
CREATE TABLE "outbound_clicks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "target" "click_target" NOT NULL,
    "user_id" UUID,
    "club_id" UUID NOT NULL,
    "offer_id" UUID,

    CONSTRAINT "outbound_clicks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "outbound_clicks_user_id_idx" ON "outbound_clicks"("user_id");

-- CreateIndex
CREATE INDEX "outbound_clicks_club_id_idx" ON "outbound_clicks"("club_id");

-- CreateIndex
CREATE INDEX "outbound_clicks_offer_id_idx" ON "outbound_clicks"("offer_id");

-- AddForeignKey: a deleted user's past clicks stay in the log, just
-- unattributed -- same reasoning as keeping the log at all for guests.
ALTER TABLE "outbound_clicks" ADD CONSTRAINT "outbound_clicks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: deleting a club (rare, deliberate -- 2.1) takes its own
-- click log with it, unlike sparring_offers.club_id (Restrict) which blocks
-- the delete instead.
ALTER TABLE "outbound_clicks" ADD CONSTRAINT "outbound_clicks_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: which offer a click happened on doesn't need to outlive it.
ALTER TABLE "outbound_clicks" ADD CONSTRAINT "outbound_clicks_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "sparring_offers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- A new table must enable RLS in the same migration (rule from the
-- 2026-09-29 migration). No policy at all, unlike messages (3.15): nobody
-- reads this table through the client, only the owner (Prisma, 1.2) writes
-- it, so deny-by-default for anon and authenticated is exactly right as is.
ALTER TABLE "outbound_clicks" ENABLE ROW LEVEL SECURITY;
