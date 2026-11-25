-- Slice PD5 (docs/PADEL-PLAN.md, PD5.1): club news. Additive: one new
-- table, nothing existing changes shape.

-- CreateTable
CREATE TABLE "club_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "club_id" UUID NOT NULL,
    "author_id" UUID,
    "title" VARCHAR(100) NOT NULL,
    "body" VARCHAR(1000) NOT NULL,

    CONSTRAINT "club_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: a club's page lists its newest news first.
CREATE INDEX "club_events_club_id_created_at_idx" ON "club_events"("club_id", "created_at");

-- CreateIndex: the author's foreign key (SET NULL on account deletion).
CREATE INDEX "club_events_author_id_idx" ON "club_events"("author_id");

-- AddForeignKey: news goes away with its club, and stays (without an
-- author) when the staff member's account is deleted.
ALTER TABLE "club_events" ADD CONSTRAINT "club_events_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "club_events" ADD CONSTRAINT "club_events_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Hand-written checks: no blank title or text (at least one non-space
-- character; btrim alone would let a text of only newlines through),
-- whoever writes the row.
ALTER TABLE "club_events" ADD CONSTRAINT "club_events_title_not_blank_check"
  CHECK ("title" ~ '\S');
ALTER TABLE "club_events" ADD CONSTRAINT "club_events_body_not_blank_check"
  CHECK ("body" ~ '\S');

-- A new table must enable RLS in the same migration (rule from the
-- 2026-09-29 migration). No policy at all, same as player_favorites: only
-- the server (Prisma) reads and writes this table, and nothing is opened up
-- for reading.
ALTER TABLE "club_events" ENABLE ROW LEVEL SECURITY;
