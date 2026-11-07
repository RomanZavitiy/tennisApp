-- Waitlist for a FULL offer (slice T, tasks T.1-T.4). Additive only
-- (AGENTS.md §6): one new table, one column on offer_joins, one new enum
-- value. Applied directly, same workaround as every migration since 3.15
-- (decision 2026-10-14, "Міграція 3.22 застосована напряму") -- prisma
-- migrate dev still can't replay the history past auth.uid() on a shadow
-- database without the auth schema.

-- AlterTable: T.3's priority join request, flagged so the author's request
-- list can label and sort it, and the hourly cron (T.4) can find it.
-- waitlist_offered_at is separate from created_at/updated_at, which a
-- reused (previously withdrawn/declined) row would carry over from its
-- first creation -- T.4's timeout window is measured from here instead.
ALTER TABLE "offer_joins" ADD COLUMN "from_waitlist" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "offer_joins" ADD COLUMN "waitlist_offered_at" TIMESTAMPTZ;

-- AlterEnum: T.3's push when a spot opens up. Nothing in this migration
-- writes it in the same transaction, so this doesn't hit the "new enum
-- value used in the same transaction" restriction.
ALTER TYPE "notification_kind" ADD VALUE 'SPOT_OPENED';

-- CreateTable
CREATE TABLE "offer_waitlists" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" UUID NOT NULL,
    "offer_id" UUID NOT NULL,

    CONSTRAINT "offer_waitlists_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: one waitlist spot per player per offer (task T.1) -- same
-- reasoning as offer_joins' own unique index.
CREATE UNIQUE INDEX "offer_waitlists_offer_id_user_id_key" ON "offer_waitlists"("offer_id", "user_id");

-- CreateIndex: the promotion query's shape -- "the earliest entry still
-- waiting" for one offer.
CREATE INDEX "offer_waitlists_offer_id_created_at_idx" ON "offer_waitlists"("offer_id", "created_at");

-- AddForeignKey: a waitlist entry goes away with its offer or with the
-- waiting player.
ALTER TABLE "offer_waitlists" ADD CONSTRAINT "offer_waitlists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "offer_waitlists" ADD CONSTRAINT "offer_waitlists_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "sparring_offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- A new table must enable RLS in the same migration (rule from the
-- 2026-09-29 migration). No policy at all, same as offer_joins/offer_
-- invites: only the server (Prisma, 1.2) reads and writes this table.
ALTER TABLE "offer_waitlists" ENABLE ROW LEVEL SECURITY;
