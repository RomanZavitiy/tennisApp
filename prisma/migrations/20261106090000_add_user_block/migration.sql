-- Personal blocking (slice R, task R.1): "don't show me this person", a
-- player's own call, separate from an admin's account-wide blockedAt
-- (6.3/6.4). Additive only (AGENTS.md §6): one new table, nothing existing
-- changes shape. Applied directly, same workaround as every migration since
-- 3.15 (decision 2026-10-14) -- prisma migrate dev still can't replay the
-- history past auth.uid() on a shadow database without the auth schema.

-- CreateTable
CREATE TABLE "user_blocks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "blocker_id" UUID NOT NULL,
    "blocked_id" UUID NOT NULL,

    CONSTRAINT "user_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: leads with blocker_id -- every lookup is "who has this
-- player blocked", same reasoning as offer_dismissals' unique index.
CREATE UNIQUE INDEX "user_blocks_blocker_id_blocked_id_key" ON "user_blocks"("blocker_id", "blocked_id");

-- AddForeignKey: a block goes away with either side of it.
ALTER TABLE "user_blocks" ADD CONSTRAINT "user_blocks_blocker_id_fkey" FOREIGN KEY ("blocker_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_blocks" ADD CONSTRAINT "user_blocks_blocked_id_fkey" FOREIGN KEY ("blocked_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- A new table must enable RLS in the same migration (rule from the
-- 2026-09-29 migration). No policy at all, same as offer_dismissals
-- (2026-10-31): only the server (Prisma, 1.2) reads and writes this table --
-- not a new RLS judgment call.
ALTER TABLE "user_blocks" ENABLE ROW LEVEL SECURITY;
