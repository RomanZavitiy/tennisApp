-- Follow a club (session O1, task O.2, decision 2026-11-01): one new table,
-- additive only (AGENTS.md §6). Applied directly, same workaround as every
-- migration since 3.15 (decision 2026-10-14, "Міграція 3.22 застосована
-- напряму") -- prisma migrate dev still can't replay the history past
-- auth.uid() on a shadow database without the auth schema.

-- CreateTable
CREATE TABLE "club_follows" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" UUID NOT NULL,
    "club_id" UUID NOT NULL,

    CONSTRAINT "club_follows_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: leads with user_id -- one player's own "my clubs" is the
-- lookup shape most callers need, same reasoning as offer_dismissals.
CREATE UNIQUE INDEX "club_follows_user_id_club_id_key" ON "club_follows"("user_id", "club_id");

-- CreateIndex: the club page's follower count goes the other direction.
CREATE INDEX "club_follows_club_id_idx" ON "club_follows"("club_id");

-- AddForeignKey: a follow goes away with its user or with its club -- same
-- reasoning as offer_dismissals.
ALTER TABLE "club_follows" ADD CONSTRAINT "club_follows_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "club_follows" ADD CONSTRAINT "club_follows_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- A new table must enable RLS in the same migration (rule from the
-- 2026-09-29 migration). No policy at all, same as offer_dismissals,
-- notifications and push_subscriptions: only the server (Prisma, 1.2) reads
-- and writes this table today. Session O2's SECURITY DEFINER function
-- reads it as the owner, not through a policy.
ALTER TABLE "club_follows" ENABLE ROW LEVEL SECURITY;
