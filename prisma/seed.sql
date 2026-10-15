-- Minimal test data for local development. Run with `pnpm prisma db seed`.
--
-- Safe to run again and again: every row has a fixed id, and ON CONFLICT
-- resets an existing row's status to its seed value instead of adding a copy.
-- No real personal data — users are bare ids, not linked to any auth account.
-- Clubs are not seeded here: `pnpm clubs:load` loads prisma/data/clubs.json.
--
-- Fields added by later tasks (profile, offer details, scores) get their seed
-- values in the same PR that adds them.

BEGIN;

-- Two onboarded players: Alice posts an offer, Bob joins it.
-- ELO is the starting one for their NTRP (4.1): 3.5 → 1400, 4.0 → 1500.
INSERT INTO users (id, name, birth_date, gender, district, self_rated_ntrp, elo, onboarding_completed_at) VALUES
  ('00000000-0000-4000-8000-00000000a11c', 'Alice', '1995-04-12', 'FEMALE', 'KROWODRZA', 3.5, 1400, now()),
  ('00000000-0000-4000-8000-000000000b0b', 'Bob', '1990-09-30', 'MALE', 'PODGORZE', 4.0, 1500, now())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  birth_date = EXCLUDED.birth_date,
  gender = EXCLUDED.gender,
  district = EXCLUDED.district,
  self_rated_ntrp = EXCLUDED.self_rated_ntrp,
  elo = EXCLUDED.elo,
  onboarding_completed_at = COALESCE(users.onboarding_completed_at, EXCLUDED.onboarding_completed_at);

-- One singles offer in Alice's district, not tied to a club. Already played
-- (the result below), so it starts in the past and is FULL: its one place
-- went to Bob.
INSERT INTO sparring_offers (id, author_id, status, starts_at, district) VALUES
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-00000000a11c', 'FULL',
   now() - interval '2 days', 'KROWODRZA')
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  starts_at = EXCLUDED.starts_at,
  district = EXCLUDED.district;

-- Bob's request to join, already accepted by Alice.
INSERT INTO offer_joins (id, offer_id, user_id, status) VALUES
  ('00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000001',
   '00000000-0000-4000-8000-000000000b0b', 'ACCEPTED')
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;

-- The result of their match, waiting for confirmation (task 4.4): Bob filed
-- it, Alice (the author) won in three sets. auto_confirm_at resets to a
-- fresh 72h window (decision 2026-10-14) each time the seed runs.
INSERT INTO match_results
  (id, offer_join_id, status, score, winner, reported_by, auto_confirm_at) VALUES
  ('00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000002', 'PENDING',
   '[{"author":6,"player":4},{"author":3,"player":6},{"author":10,"player":8}]'::jsonb,
   'AUTHOR', 'PLAYER', now() + interval '72 hours')
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  score = EXCLUDED.score,
  winner = EXCLUDED.winner,
  reported_by = EXCLUDED.reported_by,
  auto_confirm_at = EXCLUDED.auto_confirm_at;

COMMIT;
