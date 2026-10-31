-- Hide/unhide an offer (slice N, task N.1): "hide this offer from my feed",
-- not a swipe/pass mechanic -- SpinBuddy's feed has none. Additive only
-- (AGENTS.md §6): one new table, nothing existing changes shape. Applied
-- directly, same workaround as every migration since 3.15 (decision
-- 2026-10-14, "Міграція 3.22 застосована напряму") -- prisma migrate dev
-- still can't replay the history past auth.uid() on a shadow database
-- without the auth schema.

-- CreateTable
CREATE TABLE "offer_dismissals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" UUID NOT NULL,
    "offer_id" UUID NOT NULL,

    CONSTRAINT "offer_dismissals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: leads with user_id -- the feed's exclusion query is "my
-- dismissals", the opposite lookup direction from offer_joins' unique index.
CREATE UNIQUE INDEX "offer_dismissals_user_id_offer_id_key" ON "offer_dismissals"("user_id", "offer_id");

-- AddForeignKey: a dismissal goes away with its user or with its offer --
-- same reasoning as offer_joins.
ALTER TABLE "offer_dismissals" ADD CONSTRAINT "offer_dismissals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "offer_dismissals" ADD CONSTRAINT "offer_dismissals_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "sparring_offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- A new table must enable RLS in the same migration (rule from the
-- 2026-09-29 migration). No policy at all, same as notifications
-- (2026-10-17) and push_subscriptions (2026-10-15): only the server
-- (Prisma, 1.2) reads and writes this table -- not a new RLS judgment call.
ALTER TABLE "offer_dismissals" ENABLE ROW LEVEL SECURITY;
