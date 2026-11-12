-- Makes a plain Postgres look enough like a Supabase database for the files
-- in prisma/migrations to replay on it from scratch. Local and CI only
-- (scripts/test-db.ts) -- never run against Supabase itself, which already
-- has the real versions of everything below.
--
-- The list comes from reading every migration, not from guessing. What they
-- reference outside the "public"/"private" schemas they create themselves:
--
--   auth.uid()                   RLS policies: add_messages, add_booking,
--                                add_club_submissions, add_club_chat,
--                                avatars_bucket
--   role "authenticated"         every `CREATE POLICY ... TO authenticated`
--                                and `GRANT ... TO authenticated`
--   publication supabase_realtime  add_message_type (ALTER PUBLICATION ...
--                                ADD TABLE "messages")
--   storage.buckets / storage.objects / storage.foldername()
--                                avatars_bucket. That migration skips itself
--                                when there is no storage schema; the stub
--                                here makes its policies actually run.
--
-- gen_random_uuid() is built in since Postgres 13, and btree_gist
-- (add_booking creates it itself) ships with Postgres as a trusted
-- extension, so neither needs anything here.
--
-- "anon" and "service_role" aren't named by any migration; they exist so the
-- integration tests can check deny-by-default the way the Data API would
-- hit it. The grants at the bottom copy Supabase's defaults for the same
-- reason: there, anon/authenticated hold every table privilege on "public"
-- and RLS is the only thing in the way -- without the grants a test would
-- pass on "permission denied" and prove nothing about RLS.
--
-- Idempotent: safe to run again on a database that already has it.

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role NOLOGIN NOINHERIT BYPASSRLS;
  END IF;
END
$$;

CREATE SCHEMA IF NOT EXISTS auth;
GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;

-- Same definition as Supabase's: the "sub" claim of the JWT that PostgREST /
-- Realtime put into the session, null when there is none.
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid
  LANGUAGE sql STABLE AS $$
    SELECT coalesce(
      nullif(current_setting('request.jwt.claim.sub', true), ''),
      (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
    )::uuid
  $$;
GRANT EXECUTE ON FUNCTION auth.uid() TO anon, authenticated, service_role;

CREATE SCHEMA IF NOT EXISTS storage;
GRANT USAGE ON SCHEMA storage TO anon, authenticated, service_role;

-- Only the columns avatars_bucket touches.
CREATE TABLE IF NOT EXISTS storage.buckets (
  id text PRIMARY KEY,
  name text NOT NULL,
  public boolean NOT NULL DEFAULT false,
  file_size_limit bigint,
  allowed_mime_types text[]
);
CREATE TABLE IF NOT EXISTS storage.objects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id text REFERENCES storage.buckets (id),
  name text
);
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION storage.foldername(name text) RETURNS text[]
  LANGUAGE sql IMMUTABLE AS $$
    SELECT (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1]
  $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
