-- Club submissions (slice M, task M.1): a player's tip about a club not on
-- the platform yet. Additive only (AGENTS.md §6): one new enum, one new
-- value on an existing enum, one new table, two new columns on it pointing
-- back at users. Applied directly, same workaround as every migration since
-- 3.15 (decision 2026-10-14, "Міграція 3.22 застосована напряму") -- prisma
-- migrate dev still can't replay the history past auth.uid() on a shadow
-- database without the auth schema.

-- CreateEnum
CREATE TYPE "club_submission_status" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum: M.3's rate limit on submitClub() reuses the same counter table
-- as every other mutation (tasks 6.16-6.18), one more action kind.
ALTER TYPE "rate_limit_action" ADD VALUE 'CLUB_SUBMISSION';

-- CreateTable: an inbox, not a publish pipeline -- approving a row (M2)
-- never writes a "clubs" row by itself, see the Prisma model comment.
CREATE TABLE "club_submissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "club_submission_status" NOT NULL DEFAULT 'PENDING',
    "submitted_by_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "address" VARCHAR(200) NOT NULL,
    "district_guess" "district",
    "notes" VARCHAR(500),
    "reviewed_by_id" UUID,
    "reviewed_at" TIMESTAMPTZ,
    "rejection_reason" VARCHAR(300),

    CONSTRAINT "club_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "club_submissions_submitted_by_id_idx" ON "club_submissions"("submitted_by_id");
CREATE INDEX "club_submissions_reviewed_by_id_idx" ON "club_submissions"("reviewed_by_id");

-- AddForeignKey: a submitter's deleted account takes their tips with it
-- (same reasoning as offers/reports). The reviewing admin is kept as a
-- historical pointer only, same as admin_actions.admin_id -- SetNull, not
-- Cascade/Restrict.
ALTER TABLE "club_submissions" ADD CONSTRAINT "club_submissions_submitted_by_id_fkey" FOREIGN KEY ("submitted_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "club_submissions" ADD CONSTRAINT "club_submissions_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- A new table must enable RLS in the same migration (rule from the
-- 2026-09-29 migration).
ALTER TABLE "club_submissions" ENABLE ROW LEVEL SECURITY;

-- The one new read policy this migration adds (flagged in the PR for human
-- review per AGENTS.md §10, same as every new policy that opens a read): a
-- submitter can see the status of their own tip, and an admin can see
-- every tip, without going through the app's own server -- the same
-- reasoning that gave `messages` (3.15) and `bookings`/`court_blocks`
-- (slice K) their one policy each.
--
-- "Is this user an admin" means reading `users.is_admin`, itself RLS with
-- no SELECT policy (1.17) -- a plain subquery in a policy would always see
-- zero rows, the same problem 3.15 solved with a SECURITY DEFINER function
-- in the "private" schema (created by that migration; reused here, not
-- recreated). Generic by design -- any future policy that needs "is this
-- user an admin" reuses this function instead of repeating the subquery.
CREATE FUNCTION "private"."is_admin"(p_user_id uuid) RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT EXISTS (
      SELECT 1 FROM "users" WHERE "id" = p_user_id AND "is_admin" = true
    )
  $$;

GRANT EXECUTE ON FUNCTION "private"."is_admin"(uuid) TO authenticated;

-- `(select auth.uid())` instead of `auth.uid()`: evaluated once per query,
-- not once per row (Supabase's RLS performance advice, same as 3.15/slice K).
CREATE POLICY "club_submissions: own submission or admin can read"
  ON "club_submissions" FOR SELECT TO authenticated
  USING (
    (select auth.uid()) = "submitted_by_id"
    OR "private"."is_admin"((select auth.uid()))
  );
