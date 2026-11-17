-- Slice PD3 (docs/PADEL-PLAN.md, PD3.4): favourite players. Additive: one
-- new table and one new enum value, nothing existing changes shape.

-- AlterEnum: the push "a favourite player posted a game". Nothing in this
-- migration writes the value, so the "new enum value used in the same
-- transaction" restriction doesn't apply.
ALTER TYPE "notification_kind" ADD VALUE 'FAVORITE_POSTED_OFFER';

-- CreateTable
CREATE TABLE "player_favorites" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" UUID NOT NULL,
    "favorite_id" UUID NOT NULL,

    CONSTRAINT "player_favorites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: leads with user_id -- "who are this player's favourites".
CREATE UNIQUE INDEX "player_favorites_user_id_favorite_id_key" ON "player_favorites"("user_id", "favorite_id");

-- CreateIndex: "who keeps this author as a favourite" (the new-offer push).
CREATE INDEX "player_favorites_favorite_id_idx" ON "player_favorites"("favorite_id");

-- AddForeignKey: a favourite goes away with either side of it.
ALTER TABLE "player_favorites" ADD CONSTRAINT "player_favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "player_favorites" ADD CONSTRAINT "player_favorites_favorite_id_fkey" FOREIGN KEY ("favorite_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Hand-written check: nobody is their own favourite.
ALTER TABLE "player_favorites" ADD CONSTRAINT "player_favorites_not_self_check"
  CHECK ("user_id" <> "favorite_id");

-- A new table must enable RLS in the same migration (rule from the
-- 2026-09-29 migration). No policy at all, same as user_blocks: only the
-- server (Prisma, 1.2) reads and writes this table -- not a new RLS
-- judgment call, and nothing is opened up for reading.
ALTER TABLE "player_favorites" ENABLE ROW LEVEL SECURITY;
