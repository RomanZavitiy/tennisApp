-- Club chat (session O2, task O.8, decision 2026-11-01): a third thread kind
-- on Message rather than a new table (Realtime, reports, data export and the
-- content CHECKs all already work on `messages`) -- see .agents/decisions.md.
-- Applied directly, same workaround as every migration since 3.15
-- (decision 2026-10-14) -- prisma migrate dev still can't replay the
-- history past auth.uid() on a shadow database without the auth schema.

-- AlterTable
ALTER TABLE "messages" ADD COLUMN "club_id" UUID;

-- CreateIndex: the club chat's own query -- one club's messages, oldest
-- first -- same reasoning as the offer_join_id/offer_id indexes above it.
CREATE INDEX "messages_club_id_created_at_idx" ON "messages"("club_id", "created_at");

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- A message belongs to exactly one thread: private (a join), group (a
-- doubles offer), or now a club's chat (decision 3.1, extended 2026-11-01).
-- Existing rows all have exactly one of the first two set and club_id null,
-- so every one of them satisfies the widened check unchanged.
ALTER TABLE "messages" DROP CONSTRAINT "messages_one_thread_check";
ALTER TABLE "messages" ADD CONSTRAINT "messages_one_thread_check"
  CHECK (num_nonnulls("offer_join_id", "offer_id", "club_id") = 1);

-- The membership function (3.15) gets a club branch: any follower of the
-- club may read its chat (decision 2026-11-01) -- scoped reads, not an open
-- wall. This is a new 4-arg function, not a replacement of the 3-arg one
-- below, so the policy can be swapped onto it before the old one is
-- dropped -- there's no instant where "messages" has no read policy at all.
CREATE FUNCTION "private"."is_message_thread_participant"(
  p_offer_join_id uuid, p_offer_id uuid, p_club_id uuid, p_user_id uuid
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
    -- Club thread: anyone following the club (task O.1's club_follows,
    -- read here as this function's owner -- club_follows itself has no
    -- SELECT policy of its own, same reasoning as offer_joins/
    -- sparring_offers above).
    OR EXISTS (
      SELECT 1 FROM "club_follows" cf
      WHERE cf."club_id" = p_club_id AND cf."user_id" = p_user_id
    )
  $$;

GRANT EXECUTE ON FUNCTION "private"."is_message_thread_participant"(uuid, uuid, uuid, uuid) TO authenticated;

-- Swap the policy onto the new 4-arg function, then drop the old 3-arg one
-- -- nothing calls it once the policy below no longer references it.
DROP POLICY "messages: thread participants can read" ON "messages";
CREATE POLICY "messages: thread participants can read"
  ON "messages" FOR SELECT TO authenticated
  USING ("private"."is_message_thread_participant"("offer_join_id", "offer_id", "club_id", (select auth.uid())));

DROP FUNCTION "private"."is_message_thread_participant"(uuid, uuid, uuid);
