# SpinBuddy — Court booking epic (Slice K): session prompts

**Approach (1 + 4 + 5).** Partner clubs (`Club.bookingMode = SPINBUDDY`) keep their schedule in
SpinBuddy. A player sees a court × time grid and sends a booking request, and club staff confirm or
decline it. Staff mark bookings that arrive another way (phone, twojtenis) as blocks. Every other
club keeps today's `BookingLink`. No payments.

**Branch flow**

```
main ──┬───────────────────────────────────────────────┬──► main
       └─ booking-epic ◄─ PR ─ feat/k-booking-schema   │
                       ◄─ PR ─ feat/k-booking-grid     │
                       ◄─ PR ─ feat/k-booking-request  │
                       ◄─ PR ─ feat/k-club-panel       │
                       ◄─ PR ─ feat/k-booking-offers   │
                       └───────── final PR (S17) ──────┘
```

- Each session branches from `booking-epic`, and its PR targets **`booking-epic`**, not `main`.
- `main` is merged **into** `booking-epic` at the start of each session (merge only, no rebase), so the
  final PR doesn't hit a pile of conflicts.
- Session 17 opens a single PR `booking-epic → main` (squash, title `Slice K: K.1–K.22`).
- Session 16 (partner API) is **not** part of this epic. It gets its own epic later, and only if a
  partner agrees.

**How to use:** start a new Claude Code session and paste the **Shared preamble**, then the session
prompt. Begin the next session only after the previous PR has been merged into `booking-epic`.

---

## Shared preamble (paste first in every session)

```
SpinBuddy repo. Read AGENTS.md first and follow it (change-size, tests, §9/§10 boundaries).

Before opening files, check this prompt's file list against graphify-out/GRAPH_REPORT.md and
graph.json. If HEAD is newer than the graph's commit, run `graphify update .` first. Tell me
what's missing or extra, then proceed.

Branching (epic workflow — overrides AGENTS.md §8 for Slice K):
- Integration branch is `booking-epic`. Start with:
  git fetch origin main booking-epic && git checkout booking-epic && git pull
  git merge origin/main   (merge, never rebase; if it conflicts, resolve, run checks, push
  booking-epic, then continue)
- Create the session branch from booking-epic (if this session is assigned a branch name,
  use that name, but base it on origin/booking-epic). Open the PR with base = booking-epic,
  never main. Title: "Slice K: <task ids>".

Feature context (Slice K, court booking):
- Club.bookingMode SPINBUDDY: SpinBuddy owns availability. Player sees a court × 30-min
  grid and sends a request (Booking PENDING). Club staff CONFIRM or DECLINE it. Bookings
  made outside SpinBuddy are entered as CourtBlock.
- Club.bookingMode EXTERNAL_LINK (default): keep current components/booking-link.tsx.
- No payments. No new libraries or external services without asking me.
- All times Europe/Warsaw, DST-safe. All UI copy via next-intl (messages/en.json +
  messages/pl.json); `pnpm check:i18n-keys` must pass.
- Migrations must be additive and backward-compatible: main runs without the booking code
  until the epic merges, and dev/preview may share the production DB. Don't apply a
  migration to any non-local DB without my OK.

Done = pnpm build, lint, typecheck, test green; no console.log, commented-out code or
unrelated files in the diff; PR body has a one-paragraph "why".
```

---

## Session 0 — Epic setup (one time, small)

```
Set up the court-booking epic. You have my permission to create and push the branch
`booking-epic`.

1. git fetch origin main && git checkout -b booking-epic origin/main && git push -u origin
   booking-epic
2. Open .github/workflows/ci.yml. If its pull_request/push triggers are limited to main,
   add booking-epic so PRs into the epic get CI. Commit ("CI: run on booking-epic PRs")
   and push straight to booking-epic. This is the only direct push in the epic.
3. Don't change anything else. Report back: the trigger diff, plus a reminder that I
   should add branch protection for booking-epic in GitHub (require PR + green CI).
```

---

## Session 11 — Decision + data model (no UI)

```
Slice K, tasks K.1–K.5. Branch feat/k-booking-schema → PR into booking-epic.

K.1 Decision
- .agents/decisions.md: a dated entry superseding "MVP Ships Without Court Booking". v1 is
  request-based booking for partner clubs, SpinBuddy-owned availability, no payments, no
  sync with twojtenis/tenis4U/Playmore. Why: those systems publish no API, and scraping was
  rejected (ToS + EU database right). Also record the booking-epic branch workflow.
- AGENTS.md §1: update the sentence about booking.

K.2 Schema (prisma/schema.prisma + migration)
- enum BookingMode { EXTERNAL_LINK, SPINBUDDY }; Club.bookingMode default EXTERNAL_LINK.
- Court: id, clubId→Club, name, surface (existing enum), indoor, pricePerHourPln Int?
  (NULL = unknown, never invent), active, sortOrder; unique(clubId, name).
- CourtHours: clubId, weekday 0-6, opensAt/closesAt (minutes from midnight, Warsaw);
  CHECK opensAt < closesAt; unique(clubId, weekday).
- ClubStaff: clubId, userId, role OWNER|STAFF; unique(clubId, userId).
- Booking: id, courtId, userId, offerId? (→SparringOffer), startsAt, endsAt (timestamptz),
  status PENDING|CONFIRMED|DECLINED|CANCELLED, note?, declineReason?, decidedById?,
  decidedAt?, createdAt; CHECK startsAt < endsAt.
- CourtBlock: id, courtId, startsAt, endsAt, reason?, createdById.
- No double-booking, enforced in Postgres: CREATE EXTENSION IF NOT EXISTS btree_gist;
  Booking: EXCLUDE USING gist ("courtId" WITH =, tstzrange("startsAt","endsAt") WITH &&)
  WHERE (status IN ('PENDING','CONFIRMED')); CourtBlock: same EXCLUDE, no WHERE.
  Booking-vs-block overlap is checked in code (K.4, session 13).
- Apply locally using the shadow-DB workaround in decisions.md.
- RLS: Booking readable by its user + that club's staff; CourtBlock by staff; Court and
  CourtHours public. Flag the new read policies in the PR for my review (AGENTS.md §10).

K.3 lib/validation/booking.ts (Zod): bookingRequestSchema: courtId, startsAt on :00/:30,
    duration 60|90|120, note? ≤300, offerId?; future and ≤14 days ahead.

K.4 lib/booking/availability.ts (pure):
    buildDayGrid({date, hours, courts, bookings, blocks, now, slotMinutes:30}) →
    courts × slots with FREE|TAKEN|PAST|CLOSED; canFit(grid, courtId, start, duration).
    Reuse lib/offers/krakow-time.ts and todayInKrakow() (lib/validation/profile.ts).

K.5 Tests: tests/lib/booking/availability.test.ts (both DST days, closed weekday, edge
    adjacency 18–19 vs 19:00, past slots today, blocks, canFit 90 min) and
    tests/lib/validation/booking.test.ts.

No UI this session.
```

---

## Session 12 — Club data loader + read-only grid

```
Slice K, tasks K.6–K.9. Branch feat/k-booking-grid → PR into booking-epic.

K.6 lib/validation/club.ts, lib/clubs/upsert-clubs.ts, prisma/load-clubs.ts: club data
    file may declare bookingMode, courts[] {name, surface, indoor, pricePerHourPln?} and
    hours[] {weekday, opens "08:00", closes "22:00"}. Upsert courts by (clubSlug, name); a
    court dropped from the file becomes active=false (no delete). Extend
    tests/lib/validation/club.test.ts. No test clubs in the shared DB.

K.7 lib/booking/get-day-grid.ts: server loader (lib/db.ts) for one club/day → buildDayGrid.
    Unit test with mocked db, like tests/lib/clubs/club-details.test.ts.

K.8 app/clubs/[id]/book/page.tsx (Server Component, twojtenis-style):
- not SPINBUDDY → notFound().
- Date strip today+13 via ?date=; no client fetching.
- Grid: row per court, column per 30 min. FREE = link setting ?court=&start=;
  TAKEN/PAST/CLOSED disabled, distinct styles + legend.
- ?duration=60|90|120; tell the user when the chosen start doesn't fit.
- Summary card: club, court, date, time, price (only if not NULL). "Send request" button
  disabled with "coming soon" copy.
- 375px: courts as tabs, slots as a vertical list. aria-label per slot ("Court 2,
  18:00, free").

K.9 app/clubs/[id]/page.tsx: SPINBUDDY → "Book a court" button to /clubs/[id]/book;
    EXTERNAL_LINK unchanged (don't touch components/booking-link.tsx). i18n keys in
    messages/en.json + pl.json.

No calendar/grid library. Tailwind + shadcn/ui only.
```

---

## Session 13 — Booking request (player side)

```
Slice K, tasks K.10–K.14. Branch feat/k-booking-request → PR into booking-epic.

K.10 app/clubs/[id]/book/actions.ts → requestBooking(input):
     requireOnboardedUser (lib/auth/require-onboarded-user.ts) → Zod → checkRateLimit
     (add BOOKING_REQUEST to RATE_LIMITS, lib/rate-limit/check-rate-limit.ts) → max 3
     PENDING per user → re-check via getDayGrid + canFit (incl. CourtBlock) → create
     PENDING. Catch SQLSTATE 23P01 → friendly "slot was just taken", never a 500. Refuse
     blocked users like createOffer does (blockedRefusal).

K.11 Enable the submit button from session 12: a tiny client component for pending state
     only, like components/offer-action-button.tsx. On success redirect to "My bookings".

K.12 Notify club staff: notify() (lib/notifications/notify.ts) for each ClubStaff, plus
     sendEmail() (lib/email/send.ts): "New request: Court 2, Fri 24.10, 18:00–19:30" with
     a link to /club/[clubId] (built in session 14; 404 until then; mention it in the PR).

K.13 "My bookings" on the profile: upcoming/past with status badges. cancelBooking(id):
     own booking only, PENDING/CONFIRMED, until N h before start. N goes in
     lib/booking/cancel-rules.ts (mirror lib/offers/cancel-rules.ts) + test. Cancelling a
     CONFIRMED booking notifies staff.

K.14 lib/analytics/posthog.ts: booking_requested, booking_cancelled (no PII; see
     BANNED_PROPERTY_KEYS). tests/app/clubs/book/actions.test.ts: happy path, 23P01 race,
     rate limit, PENDING cap, not onboarded, block overlap, cancel past deadline.

If this goes past ~10 files, split K.13 into its own PR before you start.
```

---

## Session 14 — Club staff panel (auth code: I review before merge)

```
Slice K, tasks K.15–K.19. Branch feat/k-club-panel → PR into booking-epic.
Auth code (AGENTS.md §9): open the PR, don't merge it yourself.

K.15 lib/auth/require-club-staff.ts → requireClubStaff(clubId). Staff are normal users
     (magic link) but don't need player onboarding: build on getCurrentUser()
     (lib/auth/require-user.ts) + a ClubStaff lookup. Non-staff → notFound(). Unit test.

K.16 app/(club)/club/[clubId]/page.tsx: PENDING queue (soonest first: player first name +
     initial, court, time, note) and today/tomorrow grid via buildDayGrid, showing who
     booked.

K.17 Actions (Zod + requireClubStaff each): confirmBooking, declineBooking(reason?) →
     notify + email the player; addBlock(courtId, start, end, reason?), removeBlock(id).
     Refuse a block that overlaps a PENDING/CONFIRMED booking. Analytics
     booking_confirmed, booking_declined.

K.18 Auto-decline PENDING T h before start. Reuse the existing reminders mechanism
     ("Notification Reminders" workflow). If a new cron is needed, stop and ask.

K.19 v1 staff onboarding is owner-run: a scripts/ entry (or a club data field for
     prisma/load-clubs.ts) that links a user email to a club as OWNER/STAFF. No self-serve.
     Tests for every action.
```

---

## Session 15 — Bookings ↔ sparring offers

```
Slice K, tasks K.20–K.22. Branch feat/k-booking-offers → PR into booking-epic.

K.20 components/offer-booking-section.tsx: for an offer at a SPINBUDDY club, the author
     gets "Book a court for this game", linking to /clubs/[id]/book prefilled with
     date/time/duration (offerEndsAt in lib/offers/offer.ts) and offerId. EXTERNAL_LINK
     clubs unchanged.

K.21 requestBooking stores offerId (only if the user is the offer's author). On
     confirmBooking, reuse the markCourtBooked() path in app/offers/[id]/actions.ts
     (courtStatus BOOKED + COURT_BOOKED_MESSAGE via postSystemMessage,
     lib/messages/post-system-message.ts). Extract a shared function; don't duplicate.

K.22 Cancelling an offer that has an active booking: offer a separate "Cancel booking too"
     action, never auto-cancel. Extend tests for offers/[id]/actions and the booking
     actions.
```

---

## Session 17 — Close the epic: booking-epic → main

```
Slice K, close the epic. Open a PR from booking-epic into main. Don't merge it.

1. git fetch origin main booking-epic && git checkout booking-epic && git merge
   origin/main; resolve conflicts, push.
2. Full check on booking-epic: pnpm build, lint, typecheck, test, test:e2e. The 4 E2E
   flows in AGENTS.md §7 must stay green.
3. Audit the whole epic diff (git diff origin/main...booking-epic): no console.log, no
   commented-out code, no stray files, no secrets; .env.example up to date; every
   migration additive; list all migrations and RLS policies for my review.
4. Check that with zero SPINBUDDY clubs the app behaves exactly like main today
   (EXTERNAL_LINK path untouched).
5. Open PR booking-epic → main, title "Slice K: K.1–K.22". Body: why (one paragraph),
   links to the 5 sub-PRs, migration list, RLS list, a manual test plan on the preview
   deploy (enable one club as SPINBUDDY locally: request → confirm → offer shows
   "court booked").
6. After merge (squash, per AGENTS.md §8), booking-epic can be deleted; ask me first.
```

---

## Session 16 — Partner integration (separate epic, only after a written agreement)

```
Only start when twojtenis (Kalio), Playmore or tenis4U, or a club's Google Calendar/iCal,
has given written agreement or API docs. A new external service is stop-and-ask
(AGENTS.md §10). Use its own epic branch, e.g. booking-partner-epic.

1. lib/booking/providers/types.ts: interface BookingProvider { getDayGrid(); request();
   cancel(); }. Move the current logic into providers/spinbuddy.ts, behaviour unchanged.
2. BookingMode gains PARTNER_<NAME>; the grid page and actions dispatch on it.
3. Partner adapter: server-only calls, cache the day grid ~60 s, fall back to BookingLink on
   error. Secrets in env only; update .env.example (no real values).
```

---

## Owner checklist (before Session 11)

- [ ] Run Session 0, then add branch protection to `booking-epic` (require PR + green CI).
- [ ] 1–2 pilot clubs in Kraków willing to keep their schedule in SpinBuddy (or at least enter blocks).
- [ ] Partnership emails: twojtenis (kontakt@twojtenis.pl), Playmore, tenis4U.
- [ ] N = cancel window (suggest 12 h). T = auto-decline window (suggest 3 h).
- [ ] E2E: unit tests only for booking, or add a 5th flow (request → confirm)?
