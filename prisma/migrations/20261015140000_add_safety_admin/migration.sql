-- Safety and a minimal admin (tasks 3.19, 6.1-6.4, 6.16-6.18, slice I).
-- Additive only (AGENTS.md §6): three brand-new tables, two new columns on
-- users, one new value on an existing enum. Applied directly like every
-- migration since 3.15 (decision 2026-10-14, "Міграція 3.22 застосована
-- напряму") -- prisma migrate dev still can't replay the history past
-- auth.uid() on a shadow database without the auth schema.

-- CreateEnum
CREATE TYPE "report_reason" AS ENUM ('NO_SHOW', 'ABUSIVE', 'FAKE_SPAM', 'INAPPROPRIATE', 'OTHER');
CREATE TYPE "report_status" AS ENUM ('OPEN', 'DISMISSED', 'RESOLVED');
CREATE TYPE "admin_action_type" AS ENUM ('DISMISS_REPORT', 'HIDE_OFFER', 'HIDE_MESSAGE', 'BLOCK_PLAYER', 'UNBLOCK_PLAYER', 'AUTOBLOCK_PLAYER', 'CONFIRM_RESULT', 'ANNUL_RESULT');
CREATE TYPE "rate_limit_action" AS ENUM ('NEW_OFFER', 'JOIN_REQUEST', 'MESSAGE', 'REPORT', 'MAGIC_LINK');

-- AlterEnum: an admin's call on a DISPUTED result (6.3) that counts towards
-- nobody's ELO or reliability -- the mirror of CONFIRMED/NO_SHOW for a
-- dispute the admin decided wasn't valid. Nothing in this migration writes
-- it anywhere that would hit the "new value used in the same transaction"
-- restriction.
ALTER TYPE "match_result_status" ADD VALUE 'ANNULLED';

-- AlterTable: role and block state (6.1, 6.4). is_admin is never written by
-- the app -- only SQL or the seed -- so it needs no default beyond false.
ALTER TABLE "users"
  ADD COLUMN "is_admin" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "blocked_at" TIMESTAMPTZ;

-- CreateTable
CREATE TABLE "reports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "report_status" NOT NULL DEFAULT 'OPEN',
    "reporter_id" UUID NOT NULL,
    "target_user_id" UUID NOT NULL,
    "reason" "report_reason" NOT NULL,
    "comment" VARCHAR(500),
    "offer_id" UUID,
    "message_id" UUID,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_actions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "action" "admin_action_type" NOT NULL,
    "reason" VARCHAR(500),
    "admin_id" UUID,
    "report_id" UUID,
    "target_user_id" UUID,
    "match_result_id" UUID,

    CONSTRAINT "admin_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: no id/created_at of its own -- the (subject, action,
-- window_start) triple is the row's whole identity (checkRateLimit upserts
-- it, lib/rate-limit/).
CREATE TABLE "rate_limit_counters" (
    "subject" VARCHAR(320) NOT NULL,
    "action" "rate_limit_action" NOT NULL,
    "window_start" TIMESTAMPTZ NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "rate_limit_counters_pkey" PRIMARY KEY ("subject", "action", "window_start")
);

-- CreateIndex
CREATE INDEX "reports_reporter_id_idx" ON "reports"("reporter_id");
CREATE INDEX "reports_target_user_id_idx" ON "reports"("target_user_id");
CREATE INDEX "reports_offer_id_idx" ON "reports"("offer_id");
CREATE INDEX "reports_message_id_idx" ON "reports"("message_id");

-- CreateIndex
CREATE INDEX "admin_actions_admin_id_idx" ON "admin_actions"("admin_id");
CREATE INDEX "admin_actions_report_id_idx" ON "admin_actions"("report_id");
CREATE INDEX "admin_actions_target_user_id_idx" ON "admin_actions"("target_user_id");
CREATE INDEX "admin_actions_match_result_id_idx" ON "admin_actions"("match_result_id");

-- CreateIndex: "one report per user per object" (task 3.19) -- the object
-- is an offer, a message, or (when neither is set) the player directly, so
-- three partial unique indexes rather than one plain unique constraint.
-- Postgres's unqualified ON CONFLICT DO NOTHING (createReport's
-- skipDuplicates) catches a conflict on any of the three.
CREATE UNIQUE INDEX "reports_reporter_offer_unique" ON "reports"("reporter_id", "offer_id") WHERE "offer_id" IS NOT NULL;
CREATE UNIQUE INDEX "reports_reporter_message_unique" ON "reports"("reporter_id", "message_id") WHERE "message_id" IS NOT NULL;
CREATE UNIQUE INDEX "reports_reporter_target_unique" ON "reports"("reporter_id", "target_user_id") WHERE "offer_id" IS NULL AND "message_id" IS NULL;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reports" ADD CONSTRAINT "reports_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reports" ADD CONSTRAINT "reports_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "sparring_offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reports" ADD CONSTRAINT "reports_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: every link here is SetNull, never Restrict/Cascade -- a
-- deleted admin, report, player or result stays in the log as a historical
-- row with that one pointer gone, same reasoning as outbound_clicks.user_id.
ALTER TABLE "admin_actions" ADD CONSTRAINT "admin_actions_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "admin_actions" ADD CONSTRAINT "admin_actions_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "admin_actions" ADD CONSTRAINT "admin_actions_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "admin_actions" ADD CONSTRAINT "admin_actions_match_result_id_fkey" FOREIGN KEY ("match_result_id") REFERENCES "match_results"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Hand-written checks, like the offer's (3.2) and the message's (3.15).

-- "On yourself -- not allowed" (3.19): target_user_id is always resolved
-- server-side (offer author / message sender), so this also catches
-- reporting your own offer or your own message, not just your own profile.
ALTER TABLE "reports" ADD CONSTRAINT "reports_not_self_check"
  CHECK ("target_user_id" <> "reporter_id");

-- At most one context per report -- neither set means a direct report
-- against the player (CHECK, not application-only, since it's a single-row
-- invariant like message_type_sender_check).
ALTER TABLE "reports" ADD CONSTRAINT "reports_at_most_one_context_check"
  CHECK ("offer_id" IS NULL OR "message_id" IS NULL);

-- An admin_actions row always points at something -- a bare log entry with
-- no report, player or result attached would be a bug writing it, not a
-- legitimate action.
ALTER TABLE "admin_actions" ADD CONSTRAINT "admin_actions_has_target_check"
  CHECK ("report_id" IS NOT NULL OR "target_user_id" IS NOT NULL OR "match_result_id" IS NOT NULL);

-- A new table must enable RLS in the same migration (rule from the
-- 2026-09-29 migration). No policy on any of the three: nobody reads them
-- through the client, only the owner (Prisma, 1.2) writes them -- same as
-- outbound_clicks.
ALTER TABLE "reports" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "admin_actions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "rate_limit_counters" ENABLE ROW LEVEL SECURITY;
