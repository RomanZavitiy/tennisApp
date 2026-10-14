-- System messages (task 3.16's model note): messages gets a `type`
-- (TEXT / SYSTEM) and `sender_id` becomes nullable, since a SYSTEM message —
-- the thread's welcome note today, more from sessions 04/06/07 — has no
-- participant as its sender. Additive and loosening only: a new enum and
-- column with a default, and a NOT NULL dropped; nothing removed or
-- renamed, and every existing row (all TEXT, all with a sender already)
-- satisfies the new CHECK unchanged.

-- CreateEnum
CREATE TYPE "message_type" AS ENUM ('TEXT', 'SYSTEM');

-- AlterTable
ALTER TABLE "messages" ADD COLUMN "type" "message_type" NOT NULL DEFAULT 'TEXT';
ALTER TABLE "messages" ALTER COLUMN "sender_id" DROP NOT NULL;

-- A SYSTEM message has no sender; a TEXT one always does.
ALTER TABLE "messages" ADD CONSTRAINT "messages_system_has_no_sender_check"
  CHECK (("type" = 'SYSTEM') = ("sender_id" IS NULL));

-- Realtime (3.18) only delivers postgres_changes for tables added to this
-- publication; RLS (3.15) still decides which rows each subscriber actually
-- receives, so this does not widen who can read what — it only lets the
-- "messages: thread participants can read" policy run over a live feed
-- instead of just one-off selects.
ALTER PUBLICATION "supabase_realtime" ADD TABLE "messages";
