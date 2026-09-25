# AGENTS.md — MatchFinder Kraków

Rules for any AI coding agent (Claude Code, Cursor, Codex, etc.) working in this repo.
Human owner reviews every change — the agent writes faster than the human can read, so
the discipline below exists to keep the diff reviewable, not to slow the agent down for
its own sake.

## 1. Project in one paragraph

A tennis matchFinder web app for Kraków: players find a court on a map, post/browse
"looking for a sparring partner" offers, and keep a profile with a self-declared level
that turns into an ELO-style rating as real matches get logged. Inspired by
twojtenis.pl's sparring board, court map and profile — nothing else from that product is
in scope. No booking/payment system in the MVP (see Open Questions in the planning doc —
this may change).

## 2. Stack

Next.js 16 (App Router) + TypeScript · Supabase (Postgres + Auth + Storage + Realtime) ·
Prisma ORM · Tailwind CSS + shadcn/ui · react-leaflet + OpenStreetMap · React Hook Form +
Zod · Resend (email) · Vercel (hosting) · GitHub Actions (CI) · Vitest + Playwright ·
pnpm.

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

## 6. Change-size discipline (the core rule — read this twice)

This is the single most important rule in this file, because it's the one the human
asked for by name.

- **One PR = one small, reviewable idea.** A handful of files at a time — think "one
  epic's one task," not "one epic."
- **~500 lines is a soft ceiling per source file.** If a file is heading past that,
  that's a signal to split it (extract a hook, a sub-component, a second module) rather
  than to keep appending. Generated/config files (`package-lock.json`,
  `prisma/migrations/*`) are exempt.
- **Never touch files outside the task at hand.** If a refactor is tempting while doing
  something else, stop, note it in `.agents/decisions.md` or as a TODO comment, and leave
  it for its own PR.
- **Every PR includes a one-paragraph summary of *why*, not just *what*.** The human is
  new to this stack; "what" is visible in the diff, "why" is not.
- If a task naturally needs touching more than ~8-10 files, stop and propose splitting it
  into two PRs before writing code, rather than after.

## 7. Testing instructions

- New logic in `lib/` (rating calculation, validation, matching rules) needs a unit test
  in the matching `tests/` path — no exceptions, this is the part most likely to have a
  subtle bug a human reviewer won't catch by reading.
- A new user-facing flow (register, post a sparring offer, confirm a match result) needs
  at least one Playwright happy-path test before it's considered done.
- Don't delete or skip a failing test to make CI green — fix the code or ask the human.

## 8. Git workflow

- Small commits, one logical change each; commit message says why, not just what changed.
- Branch per task/epic-slice (`feat/sparring-board-create`, not `feat/epic-3`).
- Open a PR rather than pushing straight to `main`; wait for the human's review on
  anything touching auth, payments (once added), or DB migrations — see Boundaries.
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
  or needs a heads-up, default to asking — a short question is cheaper than an unreviewed
  mistake in a 500-line diff.

## 10. How this file grows

Two-strikes rule: the first time the agent makes a particular mistake, note it in
`.agents/MEMORY.md` (agent's own scratch log, not reviewed line-by-line by the human).
Only if the *same* mistake happens a second time does it get promoted into a permanent
rule here. This keeps this file from bloating with one-off notes — if it's not worth
writing twice, it's not worth a permanent rule.

`.agents/decisions.md` holds short dated entries for real architectural decisions (e.g.
"2026-09-20: MVP ships without a booking system — see planning doc") so the reasoning
behind a choice isn't lost when the person who made it forgets why.

Keep this whole file well under 500 lines. If it's creeping up, that's a sign something
belongs in code comments or `.agents/decisions.md` instead of here.
