-- Polish language, part 1: UI language for e-mail and push (task 1.20).
-- Additive only (AGENTS.md §6): one new enum, one new column with a default.
-- Applied directly, same workaround as every migration since 3.15 (decision
-- 2026-10-14, "Міграція 3.22 застосована напряму") -- prisma migrate dev
-- still can't replay the history past auth.uid() on a shadow database
-- without the auth schema.

-- CreateEnum
CREATE TYPE "locale" AS ENUM ('EN', 'PL');

-- AlterTable
ALTER TABLE "users"
  ADD COLUMN "locale" "locale" NOT NULL DEFAULT 'EN';
