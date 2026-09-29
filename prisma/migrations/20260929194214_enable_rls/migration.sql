-- Turn on Row Level Security for every table, with no policies: deny by default.
--
-- Supabase exposes the public schema through its Data API, so without RLS
-- anyone holding the public anon key could read and write these tables
-- directly. With RLS on and no policies, the anon and authenticated roles see
-- nothing. Prisma connects as the table owner, which RLS does not apply to,
-- so the app keeps working. Targeted policies (Storage, Realtime) come with
-- tasks 1.2 and 1.17.
--
-- Every later migration that creates a table must enable RLS on it too.

ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clubs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sparring_offers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "offer_joins" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "match_results" ENABLE ROW LEVEL SECURITY;
