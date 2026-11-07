-- "Хочу зіграти" play intents (slice U2, task U2.1). Additive only
-- (AGENTS.md §6): one new table, two new enum values. Applied directly,
-- same workaround as every migration since 3.15 (decision 2026-10-14,
-- "Міграція 3.22 застосована напряму") -- prisma migrate dev still can't
-- replay the history past auth.uid() on a shadow database without the
-- auth schema.

-- AlterEnum: U2.4's push to a matching offer's author; U2.1's own
-- rate-limited action. Nothing in this migration writes either value in
-- the same transaction, so this doesn't hit the "new enum value used in
-- the same transaction" restriction.
ALTER TYPE "notification_kind" ADD VALUE 'INTENT_FOR_YOUR_OFFER';
ALTER TYPE "rate_limit_action" ADD VALUE 'PLAY_INTENT';

-- AlterTable: U2.3/U2.4's own "did this invite come from a PlayIntent
-- card" flag, so accepting it can fire `intent_converted`.
ALTER TABLE "offer_invites" ADD COLUMN "from_intent" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "play_intents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "times" TEXT[],
    "districts" "district"[],
    "format" "offer_format" NOT NULL DEFAULT 'SINGLES',
    "note" VARCHAR(200),
    "expires_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "play_intents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: at most one active intent per day per player (task U2.1).
CREATE UNIQUE INDEX "play_intents_user_id_date_key" ON "play_intents"("user_id", "date");

-- CreateIndex: the feed's own query shape -- live intents for one day.
CREATE INDEX "play_intents_date_idx" ON "play_intents"("date");

-- AddForeignKey: an intent goes away with the player who posted it.
ALTER TABLE "play_intents" ADD CONSTRAINT "play_intents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- A new table must enable RLS in the same migration (rule from the
-- 2026-09-29 migration). No policy at all, same as offer_joins/offer_
-- waitlists: visible to every signed-in player (owner decision
-- 2026-11-07), but read only on the server (Prisma, 1.2) -- no new
-- client-side RLS read policy.
ALTER TABLE "play_intents" ENABLE ROW LEVEL SECURITY;
