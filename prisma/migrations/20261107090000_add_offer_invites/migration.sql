-- Invite a player into an offer (slice S1, tasks S1.1-S1.3). Additive only
-- (AGENTS.md §6): one new enum, one new table, two new values on existing
-- enums. Applied directly, same workaround as every migration since 3.15
-- (decision 2026-10-14, "Міграція 3.22 застосована напряму") -- prisma
-- migrate dev still can't replay the history past auth.uid() on a shadow
-- database without the auth schema.

-- CreateEnum
CREATE TYPE "invite_status" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED');

-- AlterEnum: S1.3's two new push/email events; S1.5's new rate-limited
-- action. Nothing in this migration writes either value in the same
-- transaction, so neither hits the "new enum value used in the same
-- transaction" restriction.
ALTER TYPE "notification_kind" ADD VALUE 'INVITE_RECEIVED';
ALTER TYPE "notification_kind" ADD VALUE 'INVITE_ACCEPTED';
ALTER TYPE "rate_limit_action" ADD VALUE 'OFFER_INVITE';

-- CreateTable
CREATE TABLE "offer_invites" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "status" "invite_status" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responded_at" TIMESTAMPTZ,
    "offer_id" UUID NOT NULL,
    "inviter_id" UUID NOT NULL,
    "invitee_id" UUID NOT NULL,

    CONSTRAINT "offer_invites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: one invite per player per offer (task S1.1) -- same
-- reasoning as offer_joins' own unique index.
CREATE UNIQUE INDEX "offer_invites_offer_id_invitee_id_key" ON "offer_invites"("offer_id", "invitee_id");

-- CreateIndex: "invites I received" is the other lookup shape (the offer
-- page, task S1.3's push).
CREATE INDEX "offer_invites_invitee_id_idx" ON "offer_invites"("invitee_id");

-- AddForeignKey: an invite goes away with its offer or with either side of it.
ALTER TABLE "offer_invites" ADD CONSTRAINT "offer_invites_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "sparring_offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "offer_invites" ADD CONSTRAINT "offer_invites_inviter_id_fkey" FOREIGN KEY ("inviter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "offer_invites" ADD CONSTRAINT "offer_invites_invitee_id_fkey" FOREIGN KEY ("invitee_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- A new table must enable RLS in the same migration (rule from the
-- 2026-09-29 migration). No policy at all, same as offer_joins/offer_
-- dismissals: only the server (Prisma, 1.2) reads and writes this table.
ALTER TABLE "offer_invites" ENABLE ROW LEVEL SECURITY;
