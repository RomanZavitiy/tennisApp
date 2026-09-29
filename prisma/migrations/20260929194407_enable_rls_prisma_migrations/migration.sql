-- Prisma keeps its migration history in public._prisma_migrations, which the
-- Supabase Data API exposes like any other table. Deny by default here too,
-- so the anon key can't read or rewrite the history.
--
-- Guarded because the table isn't always there: Prisma's shadow database
-- (used by `migrate dev` to check migrations) replays them without it.

DO $$
BEGIN
  IF to_regclass('public._prisma_migrations') IS NOT NULL THEN
    ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
  END IF;
END
$$;
