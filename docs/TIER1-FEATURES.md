# SpinBuddy — Tier‑1 feature prompts: Leaderboard, Club submissions, Hide/undo

Session prompts for the three Tier‑1 features from the feature‑map review (seasonal ladder,
crowdsourced court submission, undo‑a‑pass), sized against `AGENTS.md`'s own change‑size rules
rather than guessed. Slices **L**, **M**, **N** continue the lettering after Slice K
(`docs/BOOKING-EPIC.md`).

## Sizing decision (why 4 sessions, not 3)

| Feature | Trips a stop‑and‑ask trigger (AGENTS.md §9/§10)? | Verdict |
| --- | --- | --- |
| Leaderboard | No — no new table, ~8 files, half of them one‑line nav edits | **1 session (Slice L)** |
| Club submissions | Yes, three at once: new model/migration, new RLS read policy, two separable surfaces (player form vs. admin queue) | **2 sessions (M1, M2)** |
| Hide/undo on offers | No — new table is tiny and user‑scoped (same shape as existing per‑user tables), ~8 files | **1 session (Slice N)** |

**Scoping call on "seasonal ladder":** v1 below is a read‑only leaderboard sorted by the ELO you
already compute — no `Season` entity, no challenge mechanic, no entry fee. A full challenge‑based
seasonal ladder (what TennisPAL and joinplaytennis.com actually run) is a bigger, genuinely new
subsystem and belongs in its own future epic once v1 proves people look at it. Record this as a
one‑line scope decision in `.agents/decisions.md` when you start Slice L.

**Scoping call on "undo‑a‑pass":** SpinBuddy's offer board is a filtered list, not a swipe deck —
there's no existing "pass" action to attach "undo" to. The faithful equivalent for this UI is a
**hide this offer from my feed** action plus a place to **unhide** it, named that way in the UI
(not "pass"/"undo", which belongs to a swipe interaction SpinBuddy doesn't have).

---

## Shared preamble (paste first in every session below)

```
SpinBuddy repo. Read AGENTS.md first and follow it (change-size, tests, §9/§10 boundaries).

Before opening files, check this prompt's file list against graphify-out/GRAPH_REPORT.md and
graph.json. If HEAD is newer than the graph's commit, run `graphify update .` first. Tell me
what's missing or extra, then proceed.

Branching (standard AGENTS.md §8 — no epic branch needed for these, each is its own slice
straight off main):
- git fetch origin main && git checkout -b feat/<slice>-<short-name> origin/main
- Open the PR with base = main. Title: "Slice <letter>: <task ids>".

No new libraries or external services without asking me first (AGENTS.md §2). All UI copy via
next-intl (messages/en.json + messages/pl.json); `pnpm check:i18n-keys` and
`pnpm check:i18n-strings` must pass. All times Europe/Warsaw, DST-safe where relevant.

Done = pnpm build, lint, typecheck, test green; no console.log, commented-out code or unrelated
files in the diff; PR body has a one-paragraph "why".
```

---

## Session L — Leaderboard (v1: ranked view, no new table)

```
Slice L, tasks L.1–L.8. Branch feat/l-leaderboard → PR into main.

L.1 Decision (.agents/decisions.md, one dated entry): v1 "ladder" is a read-only leaderboard
    ranking onboarded, non-blocked players by current User.elo, filterable by district and NTRP
    band. No Season model, no challenges, no entry fee — that's a deferred v2. Why: reuses data
    already captured (User.elo, matchesPlayed, district), ships in one slice.

L.2 lib/leaderboard/get-leaderboard.ts: server loader — Users where onboardingCompletedAt is set
    and blockedAt is null; optional district filter; optional NTRP-band filter (reuse the
    existing NTRP_MIN/MAX/STEP constants — find them via graphify/grep, don't redefine); order by
    elo desc; paginate top 100. Select id, name, avatarPath, district, elo, matchesPlayed. Reuse
    computeReliability() (lib/rating/reliability.ts) per row for a reliability badge.

L.3 lib/validation/leaderboard.ts (Zod): leaderboardQuerySchema — district?: District enum,
    level?: a band key mapping to an NTRP range. Parse from searchParams, invalid values fall
    back to "no filter" rather than erroring (this is a GET view, not a form submit).

L.4 app/leaderboard/page.tsx (Server Component): reads searchParams, calls get-leaderboard,
    renders a ranked list: rank #, avatar + name linking to /players/[id] (reuse PlayerLink-style
    pattern), district, ELO, matches played, reliability label. Empty state when no players match
    the filters. generateMetadata() like other list pages.

L.5 components/leaderboard-filters.tsx (client form, mirrors the existing ClubFiltersForm /
    OfferFilters pattern — same component shape, just different fields) and
    components/leaderboard-row.tsx (or reuse an existing row/card pattern if one already fits —
    check before writing a new one, per AGENTS.md §5).

L.6 Add a "Leaderboard" entry to the header nav links and the mobile nav (the existing
    HeaderNavLinks()/MobileNav() components — locate via grep, these are small one-line additions,
    don't restructure either component).

L.7 messages/en.json + pl.json: new keys for the page title, filters, empty state, reliability
    label if not already shared. Run pnpm check:i18n-keys.

L.8 Tests: tests/lib/leaderboard/get-leaderboard.test.ts — ranking order (desc by elo), district
    filter, NTRP-band filter, excludes non-onboarded and blocked users, pagination cap. No new
    Playwright spec — this isn't one of the 4 critical E2E flows (AGENTS.md §7); a unit test is
    the right level here.

If this creeps past ~10 files, stop and tell me before continuing — it shouldn't, but say so if
it does.
```

---

## Session M1 — Club submission: schema + player-facing form

```
Slice M, tasks M.1–M.7. Branch feat/m1-club-submission-form → PR into main.
This session adds the schema and the public form only — no admin UI yet (that's M2, a separate
session/PR). Flag the new RLS read policy in the PR for my review (AGENTS.md §10) before merge.

M.1 Schema (prisma/schema.prisma + migration):
    model ClubSubmission {
      id uuid default gen_random_uuid()
      createdAt timestamptz default now()
      submittedById uuid -> User (onDelete Cascade)
      name varchar(100)
      address varchar(200)
      districtGuess District? (nullable — the submitter may not know the exact dzielnica)
      notes varchar(500)? (surfaces, approx court count, contact info the player happens to know)
      status enum ClubSubmissionStatus { PENDING APPROVED REJECTED } default PENDING
      reviewedById uuid? -> User (onDelete SetNull)
      reviewedAt timestamptz?
      rejectionReason varchar(300)?
    }
    Important: approving a submission does NOT auto-create a Club row in this epic. The owner
    still verifies the details and loads the real club through the existing
    `prisma/load-clubs.ts` / clubs:load pipeline — same "never invent data, always verifiedAt"
    discipline the Club model already documents. This table is an inbox, not a publish pipeline.
    RLS: a submission is readable only by its own submittedById or an admin — this is a NEW read
    policy, call it out explicitly in the PR description.
    Apply the migration locally using the existing shadow-DB workaround documented in
    decisions.md (same one used for 3.22/4.4/etc.).

M.2 lib/validation/club-submission.ts (Zod): name required ≤100, address required ≤200,
    districtGuess optional enum, notes optional ≤500.

M.3 Add CLUB_SUBMISSION to the RateLimitAction enum (schema.prisma) and to RATE_LIMITS
    (lib/rate-limit/check-rate-limit.ts) — suggest 3/day per user, flag this number for my
    approval rather than treating it as settled.

M.4 app/clubs/suggest/page.tsx + actions.ts → submitClub(input):
    requireOnboardedUser (lib/auth/require-onboarded-user.ts) → reuse the existing
    blockedRefusal() check (same one createOffer uses) → Zod parse → checkRateLimit → insert
    PENDING row. No notification to admins in this session — the admin just checks the queue in
    M2; don't wire push/email yet.

M.5 components/club-submission-form.tsx (React Hook Form + Zod, same shape as OfferForm/
    ProfileForm) and a visible entry point: a "Don't see your club? Suggest it" link from the
    `/clubs` empty state and/or the club directory page.

M.6 Tests: tests/app/clubs/suggest/actions.test.ts (happy path; rate limit; not onboarded;
    blocked user refused) + tests/lib/validation/club-submission.test.ts.

M.7 messages/en.json + pl.json for the form and its entry point. pnpm check:i18n-keys green.

Don't build the /admin side in this session — stop here even if it's tempting to keep going.
```

---

## Session M2 — Club submission: admin review queue

```
Slice M, tasks M.8–M.12. Branch feat/m2-club-submission-admin → PR into main.
Depends on M1 being merged. Auth code touching the admin surface (AGENTS.md §9): open the PR,
don't merge it yourself.

M.8 app/admin/club-submissions/page.tsx: requireAdmin() (lib/auth/require-admin.ts, same
    notFound()-for-both-anonymous-and-non-admin pattern as the rest of /admin). List PENDING
    submissions, oldest first: submitter's firstNameAndInitial() (lib/privacy/opponent-name.ts —
    reuse it, don't show the full name), name, address, districtGuess, notes, submitted date.

M.9 actions.ts: approveSubmission(id) — requireAdmin() itself, not just the layout (every admin
    action calls it directly, per the existing pattern) — sets APPROVED, reviewedById/reviewedAt.
    rejectSubmission(id, reason?) — sets REJECTED, stores reason. Neither action creates a Club
    row (M.1's decision stands) — the owner still runs clubs:load by hand with verified data.

M.10 (optional, keep it small — skip if it pushes this past ~8 files) notify the submitter of the
     decision via the existing notify()/sendEmail() pattern. If you do this, it's exactly one new
     NotificationKind value plus one notify() call site — don't build a new notification channel
     for it.

M.11 Tests: tests/app/admin/club-submissions/actions.test.ts — admin-only (non-admin gets
     notFound, same as other admin routes), approve/reject transitions, double-decision refused
     (a PENDING-only guard, mirroring how other admin actions check status before acting).

M.12 messages/en.json + pl.json for the admin queue strings.
```

---

## Session N — Hide an offer from your feed, and undo it

```
Slice N, tasks N.1–N.8. Branch feat/n-hide-offer → PR into main.

Scoping note already decided — build this, don't re-derive it: there's no swipe/pass mechanic on
the offer feed today, so this feature is "hide this offer from my feed" + a place to "unhide" it.
Name every string and function around hide/unhide, not pass/undo.

N.1 Schema (prisma/schema.prisma + migration):
    model OfferDismissal {
      id uuid default gen_random_uuid()
      createdAt timestamptz default now()
      userId uuid -> User (onDelete Cascade)
      offerId uuid -> SparringOffer (onDelete Cascade)
      @@unique([userId, offerId])
    }
    This is a small, user-scoped table (same shape as other per-user rows already in the schema)
    — still flag the migration in the PR as routine practice, but it isn't a new RLS read-policy
    judgment call: a user can only ever read their own dismissals, same as everything else scoped
    by userId today.

N.2 Apply the migration locally with the existing shadow-DB workaround (decisions.md).

N.3 lib/offers/feed-filters.ts (or feed.ts, wherever getOfferFeed's feedWhere() lives): extend the
    feed query to exclude offers the current user has dismissed — same idea as the existing
    "hide past offers" filter, just one more condition. Unit test the exclusion.

N.4 app/offers/[id]/actions.ts or a new small lib/offers/dismissals/actions.ts (follow whatever
    existing file this fits best into — don't create a new file if the offer actions file isn't
    already near the ~500-line ceiling):
    dismissOffer(offerId) / undismissOffer(offerId) — requireOnboardedUser, idempotent (dismissing
    twice is a no-op — reuse the same skipDuplicates idiom requestToJoin already uses). No
    ownership check needed: any onboarded user may dismiss any offer they can see, including
    their own (edge case, but simplest to allow rather than special-case).

N.5 components/offer-card.tsx: a small "Hide" icon button per card; optimistic client-side
    removal from the visible list on click (no full page reload).

N.6 A way back in: either a `?show=hidden` toggle on the existing feed page, or a small
    app/offers/hidden/page.tsx — pick whichever reuses more of the existing feed/OfferCard
    rendering rather than building a second list UI from scratch. Each row gets an "Unhide"
    button calling undismissOffer.

N.7 Tests: extend tests/lib/offers/feed-filters.test.ts (dismissed offers excluded from the main
    feed) and tests/app/offers/actions.test.ts (dismiss, undismiss, dismissing twice is a no-op).

N.8 messages/en.json + pl.json for "Hide" / "Unhide" / the hidden-offers view.

No new Playwright spec — this isn't one of the 4 critical E2E flows; unit tests are sufficient.
```

---

## Owner checklist (before starting)

- [ ] Decide the CLUB_SUBMISSION rate limit (M.3 suggests 3/day — confirm or change).
- [ ] Review the new `ClubSubmission` RLS read policy before merging M1 (AGENTS.md §10).
- [ ] Decide whether M2's submitter-notification step (M.10) is worth doing now or later.
- [ ] After L ships: watch whether anyone actually opens `/leaderboard` before investing in a
      real seasonal-ladder v2 (Season model, challenges, standings).
