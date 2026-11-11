# AGENTS.md — SpinBuddy

Rules for any AI coding agent (Claude Code, Cursor, Codex, etc.) working in this repo.
The human owner does not read diffs line by line (decision 2026-11-07). Throughput comes
first; the safety net is the test suite, CI, and the stop-and-ask boundaries in §9/§10 —
not small PRs.

## 1. Project in one paragraph

A tennis matchFinder web app for Kraków: players find a court on a map, post/browse
"looking for a sparring partner" offers, and keep a profile with a self-declared level
that turns into an ELO-style rating as real matches get logged. Inspired by
twojtenis.pl's sparring board, court map and profile — nothing else from that product is
in scope. V1 adds request-based court booking for partner clubs (SpinBuddy-owned
availability, no payments, no sync with third-party booking sites — decision 2026-10-21;
how to onboard a partner club is in `docs/ROADMAP.md`); clubs not yet onboarded as
partners keep the external-link booking flow. What's still open: `docs/ROADMAP.md`.

## 2. Stack

Next.js 16 (App Router) + TypeScript · Supabase (Postgres + Auth + Storage + Realtime) ·
`motion` (animation) · `next-themes` (dark mode) ·
Prisma ORM · Tailwind CSS + shadcn/ui · react-leaflet + OpenStreetMap · React Hook Form +
Zod · Resend (email) · Vercel (hosting) · GitHub Actions (CI) · Vitest + Playwright ·
pnpm · PostHog EU (product analytics, `posthog-node`, server-only — decision 2026-10-14) ·
Sentry (error monitoring, `@sentry/nextjs`, free plan — decision 2026-10-14).

Don't introduce a new library, framework, or service outside this list without flagging
it to the human first — even a small one. Two competing form libraries or two ORMs in
the same repo is exactly the kind of chaos this file exists to prevent.

## 3. Build & test commands

```
pnpm install         # install deps
pnpm dev             # local dev server
pnpm build           # production build — must pass before any PR is proposed as done
pnpm lint            # eslint
pnpm typecheck       # tsc --noEmit
pnpm test            # vitest (unit/integration)
pnpm test:e2e        # playwright (end-to-end)
pnpm prisma migrate dev      # create/apply a local migration
pnpm prisma studio            # inspect local DB
```

Success criteria, not step-lists: a change is done when `pnpm build`, `pnpm lint`,
`pnpm typecheck`, and `pnpm test` are all green, and `git diff` contains no
`console.log`, no commented-out blocks, and no unrelated file touched.

## 4. Project structure

```
app/                # Next.js App Router routes (pages, layouts, server actions)
components/         # shared React components (ui/ = shadcn primitives, rest = feature components)
lib/                # framework-agnostic logic: db client, auth helpers, rating calc, validation schemas
prisma/             # schema.prisma + migrations/
tests/              # vitest unit/integration tests, mirrors app/ and lib/ structure
e2e/                # playwright specs
public/             # static assets
.agents/            # decisions.md (architecture decisions) + MEMORY.md (agent working notes)
```

New top-level folders need a one-line reason in the PR description.

## 5. Code style (only where it differs from ecosystem defaults)

- TypeScript strict mode is on — do not weaken `tsconfig.json` to silence an error; fix
  the type instead.
- Server state (DB reads/writes) lives in Server Components or server actions, not in
  client components with `useEffect` fetches, unless there's a specific interactivity
  reason.
- All user input is validated with a Zod schema before it touches the database — no
  exceptions, including admin-only forms.
- Prefer editing an existing file over creating a new one that duplicates similar logic;
  search for an existing helper before writing a new one.

## 6. Change size (relaxed 2026-11-07)

- **No limit on PR size or file count.** A PR can cover one slice or several. Don't stop
  to propose splitting because a change touches many files.
- **One session can ship several slices back-to-back.** Prefer grouping slices that depend
  on each other or share code (e.g. S1 → S2) into one session, so the codebase context is
  built once, not re-learned per slice.
- **~500 lines is a soft ceiling per source file.** Not for review — big files are harder
  for agents to read and edit. If a file is heading past that, split it (extract a hook,
  a sub-component, a second module). Generated/config files (`pnpm-lock.yaml`,
  `prisma/migrations/*`) are exempt.
- **Refactors along the way are fine** when they serve the task (removing duplication the
  new code would add, splitting a file that grows too big). Unrelated cleanups still go in
  their own commit, so `git log` stays readable.
- **Every PR includes a short summary of *why*, not just *what*** — it's the project's
  history, even if nobody reads the diff.

## 7. Testing instructions

- New logic in `lib/` (rating calculation, validation, matching rules) needs a unit test
  in the matching `tests/` path — no exceptions. Nobody reads the diff, so the tests are
  the only reviewer.
- E2E (Playwright) covers only 4 critical flows, end to end: (1) sign in → onboarding;
  (2) create an offer → see it in the feed; (3) join request → acceptance → a chat
  message; (4) result → confirmation → ELO changes. Every other flow gets a unit test,
  not a new Playwright spec.
- Don't delete or skip a failing test to make CI green — fix the code or ask the human.

## 8. Git workflow

- Commits per logical step (a slice or a big chunk of one); commit message says why, not
  just what changed.
- One branch (`feat/<slices>-<short-name>`) = one PR, covering one slice or several. A
  slice is a vertical piece of functionality — usually several task IDs from the plan doc —
  and the agent works through all of them back-to-back without stopping between tasks or
  slices.
- Open a PR rather than pushing straight to `main`. The owner checks the result on the
  preview deploy, not the diff (subject to the stop-and-ask conditions in §10).
- `main` is protected: PRs land only by squash-merge with green CI, and the squash commit
  is the PR title, which carries every slice and task ID in it (e.g.
  `Slices S1+S2: S1.1–S1.5, S2.1–S2.3`), so `git log --oneline main` reads as the list of
  finished slices.
- Never `git push --force` to a shared branch, never rewrite history the human has
  already pulled.

## 9. Boundaries — do not act without explicit human approval

- **Secrets:** never write a real API key, DB URL, or token into a tracked file. `.env*`
  files (except `.env.example`) are gitignored — verify before every commit that touches
  env handling.
- **DB migrations:** you can draft a Prisma migration, but do not run `prisma migrate
  deploy` against anything but a local/dev database, and flag any migration that drops or
  renames a column for explicit review — those are not reversible for free.
- **Auth & (future) payment code:** propose changes, don't merge them unreviewed.
- **Deleting data or files in bulk:** ask first, always.
- **Anything not listed above:** if you're unsure whether something is a "regular" change
  or needs a heads-up, default to asking — a short question is cheaper than a mistake
  nobody will catch in the diff.

## 10. How this file grows

Two-strikes rule: the first time the agent makes a particular mistake, note it in
`.agents/MEMORY.md` (agent's own scratch log, not reviewed line-by-line by the human).
Only if the *same* mistake happens a second time does it get promoted into a permanent
rule here. This keeps this file from bloating with one-off notes — if it's not worth
writing twice, it's not worth a permanent rule.

`.agents/decisions.md` holds short dated entries, but only for irreversible decisions:
DB schema, RLS, the ELO formula, privacy/data-deletion choices, and new external
services (e.g. "2026-09-20: MVP ships without a booking system — see planning doc") so
the reasoning behind a choice isn't lost when the person who made it forgets why. Routine
implementation details go in the PR description instead, not here.

The agent stops and asks the human only when one of these is true: a new external
service is needed; a migration would drop or rename data; a new RLS policy would open up
reads; or a secret is needed that it doesn't have. Everything else, the agent decides on
its own and records the "why" in the PR.

Keep this whole file well under 500 lines. If it's creeping up, that's a sign something
belongs in code comments or `.agents/decisions.md` instead of here.
