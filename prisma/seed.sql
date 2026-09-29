-- Minimal test data for local development. Run with `pnpm prisma db seed`.
--
-- Safe to run again and again: every row has a fixed id, and ON CONFLICT
-- resets an existing row's status to its seed value instead of adding a copy.
-- No real personal data — users are bare ids, not linked to any auth account.
-- Clubs are not seeded here; Epic 2 fills them from hand-checked data.
--
-- Fields added by later tasks (profile, offer details, scores) get their seed
-- values in the same PR that adds them.

BEGIN;

-- Two players: Alice posts an offer, Bob joins it.
INSERT INTO users (id) VALUES
  ('00000000-0000-4000-8000-00000000a11c'),
  ('00000000-0000-4000-8000-000000000b0b')
ON CONFLICT (id) DO NOTHING;

-- One open offer, not tied to a club.
INSERT INTO sparring_offers (id, author_id, status) VALUES
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-00000000a11c', 'OPEN')
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;

-- Bob's request to join, already accepted by Alice.
INSERT INTO offer_joins (id, offer_id, user_id, status) VALUES
  ('00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000001',
   '00000000-0000-4000-8000-000000000b0b', 'ACCEPTED')
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;

-- The result of their match, waiting for confirmation.
INSERT INTO match_results (id, offer_join_id, status) VALUES
  ('00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000002', 'PENDING')
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;

COMMIT;
