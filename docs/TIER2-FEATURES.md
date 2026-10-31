# SpinBuddy — Tier‑2 feature prompts: Club chat, Coaching directory

Session prompts for the two Tier‑2 features from the feature‑map review ("differentiate, small,
scoped"): club‑level chat and a coaching directory. Sized against `AGENTS.md`'s change‑size
rules the same way `docs/TIER1-FEATURES.md` was. Slices **O** and **P** continue the lettering
after Slice N.

## Owner decisions already taken (2026-10-31) — build these, don't re-derive them

- **Club chat is for followers, not an open wall.** A player follows a club (new `ClubFollow`
  row); only followers can read and post in that club's chat. This keeps reads scoped and gives a
  "my clubs" audience for later features. The other option was an open wall that any onboarded
  user could read, and it was rejected.
- **The coaching directory is owner-curated data**, loaded the same way clubs are (data file →
  Zod check → upsert script, with `verifiedAt` on every row). No self-serve coach profiles and no
  approval queue in v1. Contact goes out by phone or website, with no in-app booking and no
  payments.

## Sizing decision (why 4 sessions)

| Feature | Trips a stop‑and‑ask trigger (AGENTS.md §9/§10)? | Verdict |
| --- | --- | --- |
| Club follow | No: small user-scoped table, server-only reads (RLS on, no policy) | **1 session (O1)** |
| Club chat | **Yes:** changes the `messages` CHECK and replaces the one RLS read policy on `messages` | **1 session (O2)**, the risky part isolated in its own PR |
| Coach data pipeline | No new RLS read (server reads only), but real people's personal data | **1 session (P1)** |
| Coach directory page | No | **1 session (P2)** |

**Why chat is split from follow:** O2 is the only slice that touches an existing RLS policy (the
`messages` read policy that Realtime depends on). Keeping it in its own PR means you review that
SQL by itself, without follow-button UI mixed into the same diff.

**Out of scope for v1 (each needs its own decision later):**
- **Push/email for club-chat messages.** `notify()` requires an `offerId`, and
  `notifications.offer_id` is NOT NULL (see decisions.md 2026-10-30, M.10). Club chat ships with
  no notifications, and the bell stays offer-only.
- **Coaches claiming or editing their own listing**, and coaching requests or booking in-app.
- **Club staff moderating their own chat.** Moderation stays with the existing admin report queue.

---

## Shared preamble (paste first in every session below)

```
SpinBuddy repo. Read AGENTS.md first and follow it (change-size, tests, §9/§10 boundaries).

Before opening files, check this prompt's file list against graphify-out/GRAPH_REPORT.md and
graph.json. If HEAD is newer than the graph's commit, run `graphify update .` first. Tell me
what's missing or extra, then proceed.

Branching (standard AGENTS.md §8, each slice straight off main):
- git fetch origin main && git checkout -b feat/<slice>-<short-name> origin/main
- Open the PR with base = main. Title: "Slice <letter>: <task ids>".

No new libraries or external services without asking me first (AGENTS.md §2). All UI copy via
next-intl (messages/en.json + messages/pl.json); `pnpm check:i18n-keys` and
`pnpm check:i18n-strings` must pass. All times Europe/Warsaw, DST-safe where relevant.

Done = pnpm build, lint, typecheck, test green; no console.log, commented-out code or unrelated
files in the diff; PR body has a one-paragraph "why".
```

---

## Session O1 — Follow a club

```
Slice O, tasks O.1–O.7. Branch feat/o1-club-follow → PR into main.
No chat in this session. That's O2, which depends on this one being merged.

O.1 Decision (.agents/decisions.md, one dated entry): club chat is follower-scoped (owner call
    2026-10-31, docs/TIER2-FEATURES.md). Following is free, instant and needs no approval.
    Unfollowing removes chat access immediately. Why: scoped reads, and an audience for later.

O.2 Schema (prisma/schema.prisma + migration):
    model ClubFollow {
      id uuid default gen_random_uuid()
      createdAt timestamptz default now()
      userId uuid -> User (onDelete Cascade)
      clubId uuid -> Club (onDelete Cascade)
      @@unique([userId, clubId])
      @@index([clubId])
    }
    Enable RLS in the same migration with NO policy: reads go through the server only (same
    as offer_dismissals). O2's SECURITY DEFINER function reads it as the owner. Apply locally
    with the shadow-DB workaround from decisions.md (`prisma db execute --file` +
    `migrate resolve --applied`).

O.3 app/clubs/[id]/follow-actions.ts: followClub(clubId) / unfollowClub(clubId).
    requireOnboardedUser → blockedRefusal() (same check createOffer/sendMessage use) →
    z.uuid() → club must exist (missing club → notFound-style error). Idempotent: following
    twice is a no-op (skipDuplicates, the same idiom N.4 / requestToJoin use), and unfollowing
    when not following is a no-op. revalidatePath the club page. captureEvent("club_followed" /
    "club_unfollowed").

O.4 lib/clubs/club-details.ts: extend getClub() (or add a small sibling loader there, not a
    new file) with followerCount and viewerFollows for the current user.

O.5 components/follow-club-button.tsx (client, useTransition, optimistic toggle) + render it on
    app/clubs/[id]/page.tsx with the follower count. Signed-out viewers see a sign-in link
    instead, using the club page's existing signed-out pattern.

O.6 lib/privacy/export-user-data.ts: include the user's followed clubs (slug + name +
    createdAt) in the GDPR export. Cascade delete already covers account deletion, so confirm
    that in the PR rather than adding code.

O.7 Tests + i18n: tests/app/clubs/follow-actions.test.ts (follow, unfollow, double-follow no-op,
    not onboarded, blocked user refused, unknown club). Extend the export-user-data test.
    messages/en.json + pl.json.

Expected ~9 files. If it goes past ~10, stop and tell me.
```

---

## Session O2 — Club chat (Message.clubId + RLS)

```
Slice O, tasks O.8–O.15. Branch feat/o2-club-chat → PR into main.
Depends on O1 merged. STOP-AND-ASK (AGENTS.md §10): this changes a CHECK constraint and
REPLACES the only RLS read policy on `messages`. Put the full SQL in the PR description and
don't merge it yourself.

O.8 Schema + migration:
    - Message.clubId uuid? -> Club (onDelete Cascade), @@index([clubId, createdAt]).
    - Drop and re-add messages_one_thread_check as
      num_nonnulls("offer_join_id", "offer_id", "club_id") = 1. Existing rows all satisfy it,
      and no data changes.
    - New private."is_message_thread_participant"(join, offer, club, user) with a club branch:
      EXISTS a club_follows row for (club, user). Keep the existing two branches exactly as they
      are. Drop and recreate the "messages: thread participants can read" policy on the new
      4-arg function, then drop the old 3-arg one. GRANT EXECUTE on it as the original
      migration did.
    - decisions.md entry: why a third thread kind on Message rather than a new table (Realtime,
      reports, data export and the content CHECKs all already work on `messages`).

O.9 lib/messages/thread-rules.ts: canWriteToClubThread(isFollower, user). Followers write;
    blocked users never write (also enforced by blockedRefusal). Unit test it.

O.10 lib/messages/thread-data.ts: getClubThread(clubId, viewerId). Returns null for
     non-followers ("someone else's thread looks the same as a missing one"). Last 100
     messages, oldest first, with sender names via firstNameAndInitial()
     (lib/privacy/opponent-name.ts). A club chat is semi-public, so never full names.

O.11 app/clubs/[id]/chat-actions.ts:
     - sendClubMessage(clubId, content): the same chain as sendMessage in
       app/offers/[id]/actions.ts (requireOnboardedUser → blockedRefusal → z.uuid →
       messageContentSchema → checkRateLimit(user.id, "MESSAGE") → follower check → insert).
       Reuse the existing MESSAGE limit. Don't add a new RateLimitAction. No notify() call
       (see "Out of scope").
     - reportClubMessage(clubId, messageId, input): mirrors reportMessage in
       app/offers/[id]/report-actions.ts, reusing createReport(). The message must belong to
       this club, be TEXT, and the reporter must be a follower.
     Keep both out of app/offers/[id]/actions.ts (453 lines already, near the ceiling).

O.12 components/message-thread.tsx: generalize instead of copying. Replace the hardcoded
     offerJoinId with a `thread` prop ({ kind: "join", id } | { kind: "club", id }) that picks
     the Realtime filter (offer_join_id=eq.X / club_id=eq.X), the channel name and the send
     action. The join thread's behaviour must not change. Check components/join-thread.tsx for
     how the per-message Report button is wired and pass the report action the same way.

O.13 app/clubs/[id]/chat/page.tsx (its own route, not a section of the 166-line club page):
     requireOnboardedUser. Not a follower → show the follow button from O1 plus a one-line
     explanation, not the thread. Link to it from the club page next to the follow button.

O.14 Admin: confirm app/admin/reports renders a reported club message (it may assume
     offerJoinId to build a link back to the thread). Fix that one spot if it does, and don't
     restructure the page.

O.15 Tests + i18n: tests/app/clubs/chat-actions.test.ts (send happy path, non-follower
     refused, blocked refused, rate-limited, report: wrong club / SYSTEM message refused),
     thread-rules test, getClubThread non-follower → null. messages/en.json + pl.json.
     No new Playwright spec. E2E flow (3) covers the join chat, and it must still pass
     unchanged, which is the regression check for O.12.

Expected ~10 files plus the migration. If the message-thread generalization balloons, stop
and tell me before splitting it out.
```

---

## Session P1 — Coach data model + load pipeline

```
Slice P, tasks P.1–P.6. Branch feat/p1-coach-data → PR into main.
No public page in this session. That's P2.

P.1 Decision (.agents/decisions.md): coaches are owner-curated, loaded like clubs, never
    self-registered in v1. Every listed coach has agreed to be listed (personal data of a real
    person, so GDPR consent comes before data entry). Record where that consent is kept
    (outside the repo).

P.2 Schema + migration:
    model Coach {
      id uuid, createdAt, updatedAt
      slug varchar(60) @unique     (stable key from the data file, same as Club.slug)
      name varchar(100)
      bio varchar(600)?
      district District?
      levels  CoachLevel[]         (new enum: BEGINNER, INTERMEDIATE, ADVANCED, KIDS)
      languages Locale[]           (reuse the existing Locale enum if it fits, otherwise a small
                                    enum, and decide in the PR)
      priceInfo varchar(300)?      (free text, same reasoning as Club.priceInfo)
      phone varchar(30)?, websiteUrl varchar(500)?
      verifiedAt date              (shown on the page, like clubs)
      clubs Club[]                 (implicit many-to-many: where they teach)
    }
    RLS on, no policy (server reads only). CHECKs mirroring Club's (slug format, URL scheme).

P.3 lib/validation/coach.ts: Zod schema for one coach entry in the data file, the same shape
    and strictness as lib/validation/club.ts (clubs referenced by slug and must exist).

P.4 lib/coaches/upsert-coaches.ts + prisma/load-coaches.ts + "coaches:load" script in
    package.json, mirroring lib/clubs/upsert-clubs.ts / prisma/load-clubs.ts (upsert by slug,
    re-running is safe, and coach↔club links are replaced, not appended).

P.5 prisma/data/coaches.json: an EMPTY array plus the format documented in the loader's header
    comment. Don't invent coaches. The owner fills real, consented entries.

P.6 Tests: tests/lib/validation/coach.test.ts + tests/lib/coaches/upsert-coaches.test.ts
    (idempotent re-run, unknown club slug rejected, club links replaced).
    Also delete-on-account-deletion doesn't apply (coaches aren't Users), so say so in the PR.
```

---

## Session P2 — Coaching directory page

```
Slice P, tasks P.7–P.12. Branch feat/p2-coach-directory → PR into main. Depends on P1.

P.7 lib/coaches/get-coaches.ts: loader with optional district and level filters, ordered by
    name. Includes the club names/slugs each coach teaches at.

P.8 lib/validation/coaches-query.ts (Zod, same lenient GET-view rule as
    lib/validation/leaderboard.ts: invalid params fall back to "no filter").

P.9 app/coaches/page.tsx (Server Component) + generateMetadata(). Cards show the name, bio,
    levels, languages, price info, the clubs they teach at (linked to /clubs/[id]), "checked
    <date>", and phone/website. Website links go through the existing ExternalLink component.
    Decide in the PR whether to log them as OutboundClick (adding a ClickTarget value is one
    enum line; skip it if it needs more than that). Empty state written for "directory is
    growing", not "no results", while the data file is small.

P.10 components/coach-filters.tsx (mirror ClubFiltersForm / leaderboard-filters) +
     components/coach-card.tsx (reuse an existing card pattern if one fits).

P.11 Entry points: header + mobile nav link (one line each, as L.6 did), and a small "Coaches
     at this club" list on app/clubs/[id]/page.tsx when any exist.

P.12 Tests + i18n: tests/lib/coaches/get-coaches.test.ts (filters, ordering, club join).
     messages/en.json + pl.json. No Playwright spec.
```

---

## Owner checklist

- [ ] Review O2's migration SQL (CHECK swap + replaced RLS policy) before merging.
- [ ] Decide whether club chat needs its own rate limit or the existing MESSAGE limit is enough.
      The plan reuses MESSAGE.
- [ ] Before P1 lands any real data: collect each coach's consent to be listed, and record where.
- [ ] Gather the first coach entries (name, levels, clubs, contact). P1 ships an empty file.
- [ ] After O ships: check whether follows/messages actually happen before building chat
      notifications (that needs the `notifications.offer_id` decision from M.10 first).

## Suggested order

O1 → O2 → P1 → P2. O and P are independent of each other, so P1 can run in parallel with O1/O2
if you want. Don't run O1 and O2 in parallel, because O2 needs O1's table.
