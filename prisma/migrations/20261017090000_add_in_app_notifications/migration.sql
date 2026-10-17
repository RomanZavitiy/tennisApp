-- In-app notifications (slice K2a): the list behind the header bell. Additive
-- only (AGENTS.md §6) -- a new enum and a new table, nothing existing changes
-- shape.

-- CreateEnum
CREATE TYPE "notification_kind" AS ENUM ('JOIN_REQUESTED', 'JOIN_ACCEPTED', 'JOIN_DECLINED', 'NEW_MESSAGE', 'COURT_BOOKED', 'MATCH_REMINDER_3H', 'HOW_DID_IT_GO', 'CONFIRM_RESULT_REMINDER', 'NEW_OFFER_FOR_LEVEL');

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "kind" "notification_kind" NOT NULL,
    "user_id" UUID NOT NULL,
    "offer_id" UUID NOT NULL,
    "offer_join_id" UUID,
    "read_at" TIMESTAMPTZ,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_user_id_created_at_idx" ON "notifications"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "notifications_user_id_read_at_idx" ON "notifications"("user_id", "read_at");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "sparring_offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_offer_join_id_fkey" FOREIGN KEY ("offer_join_id") REFERENCES "offer_joins"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- A thread id goes with NEW_MESSAGE and only with it: that's what lets a
-- thread's messages collapse into one unread row.
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_offer_join_id_check"
  CHECK (("kind" = 'NEW_MESSAGE') = ("offer_join_id" IS NOT NULL));

-- A new table must enable RLS in the same migration (rule from the
-- 2026-09-29 migration). No policy at all, same as push_subscriptions
-- (2026-10-15): only the server (Prisma, 1.2) reads and writes this table.
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;
