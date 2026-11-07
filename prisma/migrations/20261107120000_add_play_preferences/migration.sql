-- "Коли я люблю грати" play preferences (slice U1, task U1.1). Additive
-- only (AGENTS.md §6): three new columns, all empty by default. Applied
-- directly, same workaround as every migration since 3.15 (decision
-- 2026-10-14, "Міграція 3.22 застосована напряму") -- prisma migrate dev
-- still can't replay the history past auth.uid() on a shadow database
-- without the auth schema.

-- AlterTable: preferred_days/preferred_times are plain text arrays, not
-- Postgres enums -- they're UI-facing constants (lib/profile/options.ts,
-- lib/offers/feed-filters.ts), validated by Zod rather than a CHECK.
-- preferred_districts reuses the existing "district" enum, same shape as
-- clubs.surfaces.
ALTER TABLE "users" ADD COLUMN "preferred_days" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "users" ADD COLUMN "preferred_times" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "users" ADD COLUMN "preferred_districts" "district"[] NOT NULL DEFAULT ARRAY[]::"district"[];
