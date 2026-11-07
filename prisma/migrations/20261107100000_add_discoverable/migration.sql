-- "Підібрані гравці" discoverability opt-out (slice S2, task S2.3, owner
-- decision 2026-11-07: defaults true). Additive only (AGENTS.md §6): one
-- new column on users. Applied directly, same workaround as every
-- migration since 3.15 (decision 2026-10-14, "Міграція 3.22 застосована
-- напряму") -- prisma migrate dev still can't replay the history past
-- auth.uid() on a shadow database without the auth schema.

-- AlterTable
ALTER TABLE "users" ADD COLUMN "discoverable" BOOLEAN NOT NULL DEFAULT true;
