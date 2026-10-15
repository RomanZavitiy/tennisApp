-- Notifications (tasks 5.1-5.3, 5.10, 5.14-5.16, slice H). Additive only
-- (AGENTS.md §6) -- a new table plus nullable/defaulted columns, nothing
-- existing changes shape.

-- CreateTable: one row per subscribed browser (task 5.15).
CREATE TABLE "push_subscriptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" UUID NOT NULL,
    "endpoint" VARCHAR(500) NOT NULL,
    "p256dh" VARCHAR(200) NOT NULL,
    "auth" VARCHAR(200) NOT NULL,

    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "push_subscriptions_endpoint_key" ON "push_subscriptions"("endpoint");
CREATE INDEX "push_subscriptions_user_id_idx" ON "push_subscriptions"("user_id");

ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- A new table must enable RLS in the same migration (rule from the
-- 2026-09-29 migration). No policy at all, same as outbound_clicks
-- (2026-10-15): nobody reads or writes this table through the client,
-- only the owner (Prisma, 1.2) does.
ALTER TABLE "push_subscriptions" ENABLE ROW LEVEL SECURITY;

-- AlterTable: notification settings (5.3) and the daily cap counter the
-- "who's interested in this offer" matching (5.16) needs -- a counter, not
-- a query, same reasoning as the reliability counters (2026-10-15): nothing
-- else records when a push was sent.
ALTER TABLE "users"
  ADD COLUMN "notify_matches" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "notify_new_offers" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "notify_email_fallback" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "offer_push_sent_on" DATE,
  ADD COLUMN "offer_push_sent_count" INTEGER NOT NULL DEFAULT 0;

-- AlterTable: the "one push per thread per 5 minutes" grouping (5.16) for
-- new-message pushes.
ALTER TABLE "offer_joins"
  ADD COLUMN "last_message_push_at" TIMESTAMPTZ;

-- AlterTable: reminder pushes, each sent at most once (5.10, 5.16).
ALTER TABLE "sparring_offers"
  ADD COLUMN "match_reminder_sent_at" TIMESTAMPTZ,
  ADD COLUMN "how_did_it_go_sent_at" TIMESTAMPTZ;

ALTER TABLE "match_results"
  ADD COLUMN "result_reminder_sent_at" TIMESTAMPTZ;

-- AlterTable: email fallback (5.1-5.2, 5.6) needs an address to send to, and
-- app code never gets one from auth.users directly -- the secret key that
-- reads it is reserved for the e2e helper (decision 1.2). Nullable: rows
-- created before this migration get it filled in on their next sign-in
-- (ensureUserRow, task 1.9), not by a backfill here. Unique, like the auth
-- row it mirrors, though nothing in this app depends on that yet.
ALTER TABLE "users"
  ADD COLUMN "email" VARCHAR(320);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

