-- Court booking, v1 (slice K, decision 2026-10-21): request-based booking
-- for partner clubs, SpinBuddy-owned availability, no payments. Additive
-- only (AGENTS.md §6) — every existing club defaults to BookingMode
-- EXTERNAL_LINK, so nothing about the current bookingUrl flow changes until
-- a club is onboarded as a partner.

-- CreateEnum
CREATE TYPE "booking_mode" AS ENUM ('EXTERNAL_LINK', 'SPINBUDDY');

-- CreateEnum
CREATE TYPE "club_staff_role" AS ENUM ('OWNER', 'STAFF');

-- CreateEnum
CREATE TYPE "booking_status" AS ENUM ('PENDING', 'CONFIRMED', 'DECLINED', 'CANCELLED');

-- AlterTable
ALTER TABLE "clubs" ADD COLUMN     "booking_mode" "booking_mode" NOT NULL DEFAULT 'EXTERNAL_LINK';

-- CreateTable
CREATE TABLE "courts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "club_id" UUID NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "surface" "surface" NOT NULL,
    "indoor" BOOLEAN NOT NULL DEFAULT false,
    "price_per_hour_pln" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "courts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "court_hours" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "club_id" UUID NOT NULL,
    "weekday" INTEGER NOT NULL,
    "opens_at" INTEGER NOT NULL,
    "closes_at" INTEGER NOT NULL,

    CONSTRAINT "court_hours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "club_staff" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "club_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "club_staff_role" NOT NULL DEFAULT 'STAFF',

    CONSTRAINT "club_staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "court_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "offer_id" UUID,
    "starts_at" TIMESTAMPTZ NOT NULL,
    "ends_at" TIMESTAMPTZ NOT NULL,
    "status" "booking_status" NOT NULL DEFAULT 'PENDING',
    "note" VARCHAR(300),
    "decline_reason" VARCHAR(300),
    "decided_by_id" UUID,
    "decided_at" TIMESTAMPTZ,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "court_blocks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "court_id" UUID NOT NULL,
    "starts_at" TIMESTAMPTZ NOT NULL,
    "ends_at" TIMESTAMPTZ NOT NULL,
    "reason" VARCHAR(300),
    "created_by_id" UUID NOT NULL,

    CONSTRAINT "court_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "courts_club_id_idx" ON "courts"("club_id");

-- CreateIndex
CREATE UNIQUE INDEX "courts_club_id_name_key" ON "courts"("club_id", "name");

-- CreateIndex
CREATE INDEX "court_hours_club_id_idx" ON "court_hours"("club_id");

-- CreateIndex
CREATE UNIQUE INDEX "court_hours_club_id_weekday_key" ON "court_hours"("club_id", "weekday");

-- CreateIndex
CREATE INDEX "club_staff_user_id_idx" ON "club_staff"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "club_staff_club_id_user_id_key" ON "club_staff"("club_id", "user_id");

-- CreateIndex
CREATE INDEX "bookings_court_id_idx" ON "bookings"("court_id");

-- CreateIndex
CREATE INDEX "bookings_user_id_idx" ON "bookings"("user_id");

-- CreateIndex
CREATE INDEX "bookings_offer_id_idx" ON "bookings"("offer_id");

-- CreateIndex
CREATE INDEX "court_blocks_court_id_idx" ON "court_blocks"("court_id");

-- AddForeignKey
ALTER TABLE "courts" ADD CONSTRAINT "courts_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "court_hours" ADD CONSTRAINT "court_hours_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_staff" ADD CONSTRAINT "club_staff_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_staff" ADD CONSTRAINT "club_staff_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_court_id_fkey" FOREIGN KEY ("court_id") REFERENCES "courts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "sparring_offers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_decided_by_id_fkey" FOREIGN KEY ("decided_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "court_blocks" ADD CONSTRAINT "court_blocks_court_id_fkey" FOREIGN KEY ("court_id") REFERENCES "courts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "court_blocks" ADD CONSTRAINT "court_blocks_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Hand-written checks (same convention as task 3.2's offer CHECKs): ranges
-- and formats the Prisma schema language can't express.

ALTER TABLE "court_hours" ADD CONSTRAINT "court_hours_weekday_range_check"
  CHECK ("weekday" BETWEEN 0 AND 6);

ALTER TABLE "court_hours" ADD CONSTRAINT "court_hours_opens_before_closes_check"
  CHECK ("opens_at" < "closes_at");

ALTER TABLE "bookings" ADD CONSTRAINT "bookings_starts_before_ends_check"
  CHECK ("starts_at" < "ends_at");

ALTER TABLE "court_blocks" ADD CONSTRAINT "court_blocks_starts_before_ends_check"
  CHECK ("starts_at" < "ends_at");

-- No double-booking, enforced in Postgres rather than in application code
-- (decision 2026-10-21): two PENDING/CONFIRMED bookings, or two blocks, on
-- the same court can never overlap in time, race conditions included —
-- something a "check then insert" in a server action can't guarantee under
-- concurrent requests. Prisma has no schema syntax for EXCLUDE, so this is
-- hand-written, same as the CHECKs above.
--
-- Booking-vs-block overlap (a player requesting a slot staff already
-- blocked) is deliberately NOT one of these constraints: a block is added
-- after bookings already exist often enough that a hard DB-level exclusion
-- would make a legitimate block fail outright. That overlap is checked in
-- code instead (K.4's canFit, used before a booking is created).
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "bookings" ADD CONSTRAINT "bookings_no_overlap_excl"
  EXCLUDE USING gist ("court_id" WITH =, tstzrange("starts_at", "ends_at") WITH &&)
  WHERE ("status" IN ('PENDING', 'CONFIRMED'));

ALTER TABLE "court_blocks" ADD CONSTRAINT "court_blocks_no_overlap_excl"
  EXCLUDE USING gist ("court_id" WITH =, tstzrange("starts_at", "ends_at") WITH &&);

-- RLS. Every new table enables it in the same migration (rule from the
-- 2026-09-29 migration); most of these, like `clubs` itself, get no policy
-- at all — "public" means the app's own pages show them (read server-side
-- through Prisma, which RLS doesn't touch — decision 1.2), not that the
-- `anon`/`authenticated` roles can read them directly through the Data API.
ALTER TABLE "courts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "court_hours" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "club_staff" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bookings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "court_blocks" ENABLE ROW LEVEL SECURITY;

-- Bookings and blocks are the exception (flagged in the PR for human review
-- per AGENTS.md §10, same as every new policy that opens a read): a club
-- staff member needs to see a court's bookings and blocks without going
-- through the app's own server (e.g. a future staff dashboard reading
-- Realtime, the same reasoning that gave `messages` its one policy in task
-- 3.15). Working out "is this user staff for this court's club" means
-- reading `club_staff` through `courts`, both RLS with no policy of their
-- own, so a plain subquery in a policy would always see zero rows — the
-- same problem task 3.15 solved with a SECURITY DEFINER function in the
-- "private" schema (already created by that migration; reused here).
CREATE FUNCTION "private"."is_club_staff_for_court"(
  p_court_id uuid, p_user_id uuid
) RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT EXISTS (
      SELECT 1 FROM "courts" c
      JOIN "club_staff" cs ON cs."club_id" = c."club_id"
      WHERE c."id" = p_court_id AND cs."user_id" = p_user_id
    )
  $$;

GRANT EXECUTE ON FUNCTION "private"."is_club_staff_for_court"(uuid, uuid) TO authenticated;

-- `(select auth.uid())` instead of `auth.uid()`: evaluated once per query,
-- not once per row (Supabase's RLS performance advice, same as 3.15).
CREATE POLICY "bookings: own booking or club staff can read"
  ON "bookings" FOR SELECT TO authenticated
  USING (
    (select auth.uid()) = "user_id"
    OR "private"."is_club_staff_for_court"("court_id", (select auth.uid()))
  );

CREATE POLICY "court_blocks: club staff can read"
  ON "court_blocks" FOR SELECT TO authenticated
  USING ("private"."is_club_staff_for_court"("court_id", (select auth.uid())));
