-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sender_id" UUID NOT NULL,
    "offer_join_id" UUID,
    "offer_id" UUID,
    "content" VARCHAR(2000) NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "messages_sender_id_idx" ON "messages"("sender_id");

-- CreateIndex
CREATE INDEX "messages_offer_join_id_idx" ON "messages"("offer_join_id");

-- CreateIndex
CREATE INDEX "messages_offer_id_idx" ON "messages"("offer_id");

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_offer_join_id_fkey" FOREIGN KEY ("offer_join_id") REFERENCES "offer_joins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "sparring_offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- A new table must enable RLS in the same migration (rule from the
-- 2026-09-29 migration); no policy yet means deny by default, same as
-- every other table, until the policy below adds the one exception.
ALTER TABLE "messages" ENABLE ROW LEVEL SECURITY;

-- Hand-written checks, like the offer's (task 3.2).

-- A message belongs to exactly one thread: a private one (a join) or a
-- group one (a doubles offer) — decision 3.1.
ALTER TABLE "messages" ADD CONSTRAINT "messages_one_thread_check"
  CHECK (num_nonnulls("offer_join_id", "offer_id") = 1);

-- A message, when sent, isn't just spaces.
ALTER TABLE "messages" ADD CONSTRAINT "messages_content_not_blank_check"
  CHECK (btrim("content") <> '');

-- Realtime (tasks 3.15–3.18) reads this table with the sender's own session,
-- so RLS is the only thing deciding who can read which thread — the
-- decision for 1.2's lone exception to "no policies in public". Writes
-- always go through the server action (3.16) as the table owner, so there
-- is no INSERT/UPDATE/DELETE policy: those stay denied for anon and
-- authenticated, as e2e/rls.spec.ts already checks for every table.
--
-- Working out who is a thread's participant means reading offer_joins and
-- sparring_offers — both RLS, deny by default, with no SELECT policy of
-- their own (1.17). The `authenticated` role can't read them directly, so
-- the policy below would always see them as empty and deny everyone,
-- including real participants. A SECURITY DEFINER function, owned by the
-- same role that owns those tables (so it bypasses RLS as their owner
-- would), does the membership check instead.
--
-- It lives in its own "private" schema, not "public": PostgREST exposes
-- every function in "public" as a callable rpc/ endpoint, which would let
-- anyone with the publishable key probe thread membership directly
-- (does this join/offer id have this user as a participant?) even though
-- they could never read the function's own source through the Data API.
-- "private" isn't one of the API's exposed schemas, so the function is
-- reachable only from inside Postgres — exactly where this policy runs.
-- `search_path` is pinned so a same-named object earlier on some other
-- path can't hijack it.
CREATE SCHEMA IF NOT EXISTS "private";

CREATE FUNCTION "private"."is_message_thread_participant"(
  p_offer_join_id uuid, p_offer_id uuid, p_user_id uuid
) RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    -- Private thread: the join's player, or the offer's author.
    SELECT EXISTS (
      SELECT 1 FROM "offer_joins" oj
      JOIN "sparring_offers" o ON o."id" = oj."offer_id"
      WHERE oj."id" = p_offer_join_id
        AND (p_user_id = oj."user_id" OR p_user_id = o."author_id")
    )
    -- Group thread: the offer's author, or one of its accepted players.
    OR EXISTS (
      SELECT 1 FROM "sparring_offers" o
      WHERE o."id" = p_offer_id
        AND (
          p_user_id = o."author_id"
          OR EXISTS (
            SELECT 1 FROM "offer_joins" oj
            WHERE oj."offer_id" = o."id" AND oj."user_id" = p_user_id AND oj."status" = 'ACCEPTED'
          )
        )
    )
  $$;

-- Calling a function needs USAGE on its schema as well as EXECUTE on the
-- function itself; neither is granted to PUBLIC by default for a schema
-- created just now (unlike "public").
GRANT USAGE ON SCHEMA "private" TO authenticated;
GRANT EXECUTE ON FUNCTION "private"."is_message_thread_participant"(uuid, uuid, uuid) TO authenticated;

-- `(select auth.uid())` instead of `auth.uid()`: evaluated once per query,
-- not once per row (Supabase's RLS performance advice).
CREATE POLICY "messages: thread participants can read"
  ON "messages" FOR SELECT TO authenticated
  USING ("private"."is_message_thread_participant"("offer_join_id", "offer_id", (select auth.uid())));
