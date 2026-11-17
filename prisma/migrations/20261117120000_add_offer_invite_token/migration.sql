-- Slice PD3 (docs/PADEL-PLAN.md, PD3.3; decision 2026-11-17): an offer's
-- invite link. Additive: one nullable column, null for every existing
-- offer (no link). No RLS change: sparring_offers has no client-side read
-- policy that would expose the column -- it is read on the server only.

-- AlterTable
ALTER TABLE "sparring_offers" ADD COLUMN "invite_token" VARCHAR(64);

-- CreateIndex: a token names one offer.
CREATE UNIQUE INDEX "sparring_offers_invite_token_key" ON "sparring_offers"("invite_token");
