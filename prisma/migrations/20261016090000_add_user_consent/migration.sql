-- Legal consent (tasks 6.11, 6.12). Additive only (AGENTS.md §6): two new
-- nullable columns, no default needed since every existing row should read
-- as "hasn't agreed yet" (null consentVersion), the same state a brand new
-- row gets. Applied directly, same workaround as every migration since 3.15
-- (decision 2026-10-14, "Міграція 3.22 застосована напряму") -- prisma
-- migrate dev still can't replay the history past auth.uid() on a shadow
-- database without the auth schema.

-- AlterTable
ALTER TABLE "users"
  ADD COLUMN "consented_at" TIMESTAMPTZ,
  ADD COLUMN "consent_version" VARCHAR(20);
