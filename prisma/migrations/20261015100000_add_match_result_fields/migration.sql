-- Match results (task 4.4; score and confirmation decisions 2026-10-14).
-- Additive only: match_results existed as a skeleton (id, status,
-- offer_join_id) since the init migration; this fills in the fields the
-- result form (4.6), confirmation (4.7) and ELO application (4.8) need.
-- RLS was already enabled on this table with no policy (deny by default,
-- decision 1.2): Prisma is still the only reader, so no policy is added
-- here — same as offer_joins and sparring_offers.

-- CreateEnum
CREATE TYPE "match_party" AS ENUM ('AUTHOR', 'PLAYER');

-- AlterEnum: NO_SHOW is session 05's (4.10); added now so the status field
-- is complete per 4.4, nothing in this slice writes it.
ALTER TYPE "match_result_status" ADD VALUE 'NO_SHOW';

-- AlterTable
ALTER TABLE "match_results"
  ADD COLUMN "score" JSONB NOT NULL,
  ADD COLUMN "winner" "match_party" NOT NULL,
  ADD COLUMN "reported_by" "match_party" NOT NULL,
  ADD COLUMN "auto_confirm_at" TIMESTAMPTZ NOT NULL,
  ADD COLUMN "author_elo_before" INTEGER,
  ADD COLUMN "author_elo_after" INTEGER,
  ADD COLUMN "player_elo_before" INTEGER,
  ADD COLUMN "player_elo_after" INTEGER;

-- Hand-written checks, like the offer's (task 3.2) and the message's (3.15).

-- The score the form/server action approved (lib/validation/match-result.ts,
-- 4.5) is always 2 or 3 sets — a backstop in case a row is ever written
-- outside that path, same spirit as messages_content_not_blank_check.
ALTER TABLE "match_results" ADD CONSTRAINT "match_results_score_shape_check"
  CHECK (jsonb_typeof("score") = 'array' AND jsonb_array_length("score") BETWEEN 2 AND 3);

-- ELO snapshots are set together, exactly once, only when the result is
-- confirmed (4.8) — never partially, never for a PENDING/DISPUTED one.
ALTER TABLE "match_results" ADD CONSTRAINT "match_results_elo_with_confirmed_check"
  CHECK (
    ("status" = 'CONFIRMED') = (
      "author_elo_before" IS NOT NULL AND "author_elo_after" IS NOT NULL
      AND "player_elo_before" IS NOT NULL AND "player_elo_after" IS NOT NULL
    )
  );
