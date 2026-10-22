# Graph Report - tennisApp  (2026-10-22)

## Corpus Check
- 379 files · ~168,227 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 10 file(s) not represented in the graph (top: (none) 5, .example 1, .ico 1)

## Summary
- 1581 nodes · 4087 edges · 133 communities (70 shown, 63 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 79 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `292e6b74`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- next-intl
- lib_generated_prisma_enums
- supabase-admin.ts
- result-actions.ts
- admin/actions.ts
- availability.ts
- club-list.tsx
- offer-interest.ts
- AGENTS.md §2 Stack
- language-switcher.tsx
- translator.ts
- club.ts
- PLANNING.md (v2)
- next
- offers/[id]/actions.ts
- package.json
- login-form.tsx
- profile-form.tsx
- report-actions.ts
- components.json
- dependencies
- devDependencies
- profile.ts
- [clubId]/page.tsx
- new/actions.ts
- join-rules.ts
- captureEvent
- offer-form.tsx
- compilerOptions
- zod
- require-user.ts
- reliability.ts
- app/offers/actions.test.ts
- buttonVariants
- sendMessage
- unsubscribe/page.tsx
- avatar-upload.tsx
- [clubId]/actions.ts
- notify.test.ts
- scripts
- createSupabaseServerClient
- notify.ts
- Button
- Session 11 — Decision + data model (K.1-K.5)
- booking.ts
- notify
- delete/actions.ts
- export-user-data.ts
- book/actions.ts
- @sentry/nextjs
- ELO rating system
- options.ts
- result-form.tsx
- Court booking v1: request-based booking for SpinBuddy-owned availability at partner clubs, no payments, no sync with external booking systems (Slice K)
- messages table: one row per message, exactly one of offer_join_id/offer_id set, SELECT policy via a SECURITY DEFINER function in a private (non-API) schema — the first policy that opens public reads for authenticated (task 3.15)
- New PushSubscription table, notification-preference columns on User, and a new users.email mirror column synced by ensureUserRow on every login (tasks 5.3, 5.15, 5.16)
- autoblock.ts
- Env vars set only in Vercel dashboard; DATABASE_URL shared by Preview+Production until task 6.9; DIRECT_URL not added to Vercel (task 0.18)
- requireOnboardedUser
- book/page.tsx
- AGENTS.md §8 Git workflow
- Login: magic link + Google OAuth, no passwords
- engines
- Email in Resend test mode until own domain exists
- lint-staged
- vercel.json
- ESLint strictTypeChecked + no-console ban except warn/error (task 0.8)
- /terms and /privacy are public draft placeholder pages with a banner and a dated CURRENT_CONSENT_VERSION; onboarding adds a consent checkbox; existing users are re-gated to /consent when the version changes (tasks 6.11, 6.12)
- AGENTS.md §7 Testing instructions
- postcss.config.mjs
- CI workflow (ci.yml)
- Notification Reminders workflow
- AGENTS.md §10 How this file grows
- Spin Buddy (Brand)
- Spin Buddy Logo
- Generic File Icon Asset
- Globe Icon
- PWA App Icon (Green Circle)
- App Icon (Tennis Ball Circle)
- Maskable App Icon (512px)
- Leaflet Marker Icon 2x
- Leaflet Marker Icon
- Leaflet Marker Shadow Icon
- Next.js Logo Icon
- Vercel Logo Icon
- Window Icon (Next.js default)
- db.ts
- match-result.ts
- consent.ts
- auto-confirm.ts
- callback/route.ts
- app/layout.tsx
- club-panel.ts
- login/page.tsx
- krakow-time.ts
- send-push.ts
- messages_en
- vitest
- send.ts

## God Nodes (most connected - your core abstractions)
1. `vitest` - 94 edges
2. `next-intl` - 89 edges
3. `next` - 76 edges
4. `db` - 49 edges
5. `Button()` - 48 edges
6. `react` - 44 edges
7. `requireOnboardedUser` - 42 edges
8. `buttonVariants` - 34 edges
9. `zod` - 30 edges
10. `getCurrentUser()` - 29 edges

## Surprising Connections (you probably didn't know these)
- `Polish support implemented via next-intl in cookie-only mode (no [locale] URL segment); proxy.ts sets the locale cookie from Accept-Language on first request; users.locale column mirrors it for cron-sent mail/push (task 1.20)` --references--> `next-intl`  [EXTRACTED]
  .agents/decisions.md → package.json
- `Login forms via React Hook Form + Zod (@hookform/resolvers); /auth/callback parses params via parseCallbackParams(); email templates link to RedirectTo+token_hash (task 1.6)` --references--> `react-hook-form`  [EXTRACTED]
  .agents/decisions.md → package.json
- `Map uses leaflet+react-leaflet, loaded client-only via next/dynamic(ssr:false), explicit L.icon with bundled PNGs (task 2.4)` --references--> `react-leaflet`  [EXTRACTED]
  .agents/decisions.md → package.json
- `Project stack decision (Next.js, Supabase, Prisma, Tailwind, shadcn/ui, react-leaflet/OSM, RHF+Zod, Resend, Vercel, GitHub Actions, Vitest+Playwright, pnpm)` --references--> `react-hook-form`  [EXTRACTED]
  .agents/decisions.md → package.json
- `Project stack decision (Next.js, Supabase, Prisma, Tailwind, shadcn/ui, react-leaflet/OSM, RHF+Zod, Resend, Vercel, GitHub Actions, Vitest+Playwright, pnpm)` --references--> `react-leaflet`  [EXTRACTED]
  .agents/decisions.md → package.json

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Slice-Based Session Workflow** — docs_planning, docs_prompts_00_readme, docs_prompts_01_session_audit_and_offer, docs_prompts_02_session_join_flow, docs_prompts_03_session_chat, docs_prompts_04_session_results_and_elo, docs_prompts_05_session_reliability, docs_prompts_06_session_courts_and_booking, docs_prompts_07_session_pwa_and_notifications, docs_prompts_08_session_safety_and_admin, docs_prompts_09_session_polish_and_profile_photo, docs_prompts_10_session_launch_readiness [EXTRACTED 1.00]
- **Court booking epic branch workflow overriding standard AGENTS.md git process** — docs_booking_epic_branch_workflow, agents_section8_git_workflow, agents_decisions_20261021_booking_v1_decision [INFERRED 0.85]
- **RLS deny-by-default evolution across the schema** — agents_decisions_20260929_rls_enabled_no_policies, agents_decisions_20261003_rls_strategy_with_prisma, agents_decisions_20261004_rls_e2e_test, agents_decisions_20261012_messages_model_first_rls [INFERRED 0.85]
- **Tech stack defined consistently across AGENTS.md, README and decisions.md** — agents_decisions_20260920_project_stack, agents_section2_stack, readme_stack_glossary [INFERRED 0.85]

## Communities (133 total, 63 thin omitted)

### Community 0 - "next-intl"
Cohesion: 0.05
Nodes (66): AdminResultsPage(), metadata, NotificationsPage(), Card(), ProfilePage(), SettingsLink(), AuthorView(), OfferPage() (+58 more)

### Community 1 - "lib_generated_prisma_enums"
Cohesion: 0.06
Nodes (46): ClubPage(), ClubPageProps, generateMetadata(), OffersPage(), ExternalLink(), ClubDetails, formatCheckedDate(), Formatter (+38 more)

### Community 2 - "supabase-admin.ts"
Cohesion: 0.07
Nodes (35): admin, PNG, admin, created, PNG, signedInClient(), far, near (+27 more)

### Community 3 - "result-actions.ts"
Cohesion: 0.09
Nodes (30): JoinChangeResult, confirmResult(), disputeResult(), ErrorsT, loadSubmittableJoin(), PendingResult, SettleAction, SettleOutcome (+22 more)

### Community 4 - "admin/actions.ts"
Cohesion: 0.14
Nodes (21): AdminActionResult, annulDisputedResult(), blockFromReport(), confirmDisputedResult(), dismissReport(), hideReport(), logAction(), unblockPlayer() (+13 more)

### Community 5 - "availability.ts"
Cohesion: 0.16
Nodes (17): BLOCKING_BOOKING_STATUSES, BlockingBookingStatus, BookingInput, buildDayGrid(), BuildDayGridInput, buildDayWindows(), CourtBlockInput, CourtDayGrid (+9 more)

### Community 6 - "club-list.tsx"
Cohesion: 0.07
Nodes (38): recordOutboundClick(), Home(), BookingLink(), track(), ClubList(), ClubListEntry(), ClubListItem, ClubMap() (+30 more)

### Community 7 - "offer-interest.ts"
Cohesion: 0.14
Nodes (19): DAILY_OFFER_PUSH_LIMIT, hasDailyCapacity(), interestedCandidates(), isInterestedIn(), isQuietHours(), levelMatches(), NewOfferInfo, NTRP_MATCH_TOLERANCE (+11 more)

### Community 8 - "AGENTS.md §2 Stack"
Cohesion: 0.13
Nodes (23): AGENTS.md §2 Stack, GitHub Actions (CI), Next.js, OpenStreetMap, Playwright, pnpm, PostHog EU, Prisma ORM (+15 more)

### Community 9 - "language-switcher.tsx"
Cohesion: 0.23
Nodes (14): LanguageSwitcher(), choose(), MESSAGES, setLocale(), AppLocale, DEFAULT_LOCALE, isAppLocale(), LOCALE_COOKIE (+6 more)

### Community 10 - "translator.ts"
Cohesion: 0.21
Nodes (8): en, testTranslator(), t, input, { reportCreateManyAndReturn, checkRateLimit, maybeAutoblock }, t, tRateLimit, schema

### Community 11 - "club.ts"
Cohesion: 0.09
Nodes (23): upsertClubs(), ClubRecord, clubSchema, CourtHoursRecord, courtHoursRecordSchema, CourtRecord, courtRecordSchema, describe() (+15 more)

### Community 12 - "PLANNING.md (v2)"
Cohesion: 0.13
Nodes (29): MEMORY.md (agent working notes), AGENTS.md — SpinBuddy Agent Rules, decisions.md — Architecture Decision Log, Claude Code Planning Prompt, PLANNING-v1.md (archived), Launch Checklist — MatchFinder Kraków, PLANNING.md (v2), Slice A — Sync and Process Lightening (+21 more)

### Community 14 - "offers/[id]/actions.ts"
Cohesion: 0.13
Nodes (25): acceptJoin(), cancelOffer(), changeJoin(), declineJoin(), RequestToJoinResult, SendMessageResult, withdrawJoin(), canCancelOffer() (+17 more)

### Community 15 - "package.json"
Cohesion: 0.08
Nodes (25): eslintConfig, name, packageManager, private, version, class-variance-authority, eslint, eslint-config-next (+17 more)

### Community 16 - "login-form.tsx"
Cohesion: 0.22
Nodes (12): sendMagicLink(), SendMagicLinkResult, LoginForm(), onSubmit(), loginSchema(), LoginValues, magicLinkRequestSchema(), ValidationT (+4 more)

### Community 17 - "profile-form.tsx"
Cohesion: 0.21
Nodes (16): AddBlockForm(), AddBlockResult, ClubFiltersForm(), OfferFilters(), aria(), Field(), ProfileForm(), ProfileFormValues (+8 more)

### Community 18 - "report-actions.ts"
Cohesion: 0.21
Nodes (14): reportMessage(), reportOffer(), reportPlayer(), createReport(), CreateReportResult, ErrorsT, emptyToUndefined(), REPORT_COMMENT_MAX (+6 more)

### Community 19 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 20 - "dependencies"
Cohesion: 0.09
Nodes (22): dependencies, @base-ui/react, class-variance-authority, cn, @hookform/resolvers, leaflet, lucide-react, next (+14 more)

### Community 21 - "devDependencies"
Cohesion: 0.09
Nodes (22): devDependencies, eslint, eslint-config-next, eslint-config-prettier, husky, lint-staged, @playwright/test, prettier (+14 more)

### Community 22 - "profile.ts"
Cohesion: 0.17
Nodes (17): SaveAvatarResult, updateProfile(), completeOnboarding(), startingElo(), MIN_AGE, PROFILE_FIELDS, profileFieldErrors(), ProfileInput (+9 more)

### Community 23 - "[clubId]/page.tsx"
Cohesion: 0.21
Nodes (15): addDays(), ClubPanelPage(), metadata, blockForSlot(), bookingForSlot(), ClubPanelDay, getClubPanelDay(), getPendingQueue() (+7 more)

### Community 24 - "new/actions.ts"
Cohesion: 0.17
Nodes (12): createOffer(), blockedRefusal(), activeOffersWhere(), MAX_ACTIVE_OFFERS, checkRateLimit(), RATE_LIMITS, RateLimitResult, CreateOfferResult (+4 more)

### Community 25 - "join-rules.ts"
Cohesion: 0.47
Nodes (3): joinRefusal, NOW, refusal()

### Community 26 - "captureEvent"
Cohesion: 0.21
Nodes (10): AnalyticsEvent, EventProperties, OfferFormat, OutboundTarget, PropertiesFor, BANNED_PROPERTY_KEYS, captureEvent(), getClient() (+2 more)

### Community 27 - "offer-form.tsx"
Cohesion: 0.13
Nodes (22): aria(), ClubOption, ErrorText(), Field(), FieldErrorLike, NtrpSelect(), OfferForm(), DEFAULT_OFFER_DURATION (+14 more)

### Community 28 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 29 - "zod"
Cohesion: 0.10
Nodes (36): ActionResult, notificationSettingsSchema, removePushSubscription(), savePushSubscription(), updateNotificationSetting(), NotificationSettings, NotificationSettingsForm(), toggle() (+28 more)

### Community 30 - "require-user.ts"
Cohesion: 0.19
Nodes (9): giveConsent(), ConsentPage(), OnboardingPage(), AuthRequiredError, requireUser(), { update, redirect }, { requireUser, update, redirect, captureEvent }, valid (+1 more)

### Community 31 - "reliability.ts"
Cohesion: 0.15
Nodes (11): applyMatchElo(), applyMatchEloFromJoin(), PendingResultJoin, computeEloChange(), expectedScore(), kFactor(), MatchOutcome, Reliability (+3 more)

### Community 32 - "app/offers/actions.test.ts"
Cohesion: 0.38
Nodes (5): markCourtBooked(), requestToJoin(), postSystemMessage(), {
  requireOnboardedUser,
  offerFindUnique,
  offerFindFirst,
  offerUpdate,
  joinFindUnique,
  joinFindMany,
  joinCreateManyAndReturn,
  joinUpdateMany,
  recordLateCancellation,
  recordScheduledMatch,
  postSystemMessage,
  notify,
  checkRateLimit,
  tx,
}, upcoming

### Community 33 - "buttonVariants"
Cohesion: 0.09
Nodes (29): AccountDeletedPage(), markNotificationsReadAction(), offerIdSchema, unreadNotificationCount(), HeaderNavLinks(), isActive(), NavLink, MobileNav() (+21 more)

### Community 34 - "sendMessage"
Cohesion: 0.20
Nodes (10): sendMessage(), getJoinThread(), ThreadMessage, canWriteToThread(), isJoinThreadParticipant(), createdAt, {
  requireOnboardedUser,
  joinFindUnique,
  messageCreate,
  notify,
  checkRateLimit,
}, upcomingJoin (+2 more)

### Community 35 - "unsubscribe/page.tsx"
Cohesion: 0.25
Nodes (10): confirmUnsubscribe(), UnsubscribeResult, UnsubscribePage(), UnsubscribePageProps, UnsubscribeButton(), createUnsubscribeToken(), secret(), sign() (+2 more)

### Community 36 - "avatar-upload.tsx"
Cohesion: 0.22
Nodes (17): saveAvatar(), ACCEPT, AvatarUpload(), choose(), reset(), save(), GoogleSignInButton(), signIn() (+9 more)

### Community 37 - "[clubId]/actions.ts"
Cohesion: 0.20
Nodes (14): addBlock(), ClubPanelActionResult, confirmBooking(), declineBooking(), durationMinutes(), overlapsABooking(), removeBlock(), ClubStaffSession (+6 more)

### Community 38 - "notify.test.ts"
Cohesion: 0.22
Nodes (7): { createUnsubscribeToken }, NOW, { recordNotification }, { sendEmail }, { sendPush }, SUB, { userFindUnique, pushSubscriptionDelete, offerJoinUpdateMany }

### Community 39 - "scripts"
Cohesion: 0.12
Nodes (16): scripts, build, check:i18n-keys, check:i18n-strings, clubs:load, dev, format, format:check (+8 more)

### Community 40 - "createSupabaseServerClient"
Cohesion: 0.28
Nodes (6): signOut(), supabaseEnv(), createSupabaseServerClient(), @supabase/ssr, jar, session

### Community 41 - "notify.ts"
Cohesion: 0.21
Nodes (13): EmailTemplateInput, escapeHtml(), renderEmailHtml(), renderEmailText(), appUrl(), BookingRecipient, CATEGORY, claimMessagePushSlot() (+5 more)

### Community 42 - "Button"
Cohesion: 0.14
Nodes (18): ErrorPage(), AdminAction, AdminActionForm(), AdminActionResult, MessageRow, MessageThread(), addMessage(), submit() (+10 more)

### Community 43 - "Session 11 — Decision + data model (K.1-K.5)"
Cohesion: 0.21
Nodes (13): Booking (booking schema entity), Club.bookingMode enum (EXTERNAL_LINK / SPINBUDDY), ClubStaff (booking schema entity), Court (booking schema entity), CourtBlock (booking schema entity), CourtHours (booking schema entity), Session 0 — Epic setup, Session 11 — Decision + data model (K.1-K.5) (+5 more)

### Community 44 - "booking.ts"
Cohesion: 0.14
Nodes (15): BOOKING_DURATIONS, BOOKING_FIELDS, BOOKING_MAX_DAYS_AHEAD, BOOKING_NOTE_MAX, BookingDuration, BookingRequestInput, bookingRequestSchema(), BookingRequestValues (+7 more)

### Community 45 - "notify"
Cohesion: 0.36
Nodes (10): notify(), autoDeclinePendingBookings(), krakowTimeRangeLabel(), ReminderCounts, runNotificationReminders(), sendHowDidItGoPrompts(), sendMatchReminders(), sendResultConfirmationReminders() (+2 more)

### Community 46 - "delete/actions.ts"
Cohesion: 0.29
Nodes (7): deleteMyAccount(), DeleteAccountPage(), deleteAccountStorageAndAuth(), redactAccountData(), createSupabaseAdminClient(), {
  requireOnboardedUser,
  redactAccountData,
  deleteAccountStorageAndAuth,
  signOut,
  redirect,
}, {
  tx,
  createSupabaseAdminClient,
  storageList,
  storageRemove,
  deleteUser,
}

### Community 47 - "export-user-data.ts"
Cohesion: 0.36
Nodes (6): exportMyData(), ExportDataButton(), download(), exportUserData(), UserDataExport, {
  userFindUniqueOrThrow,
  offerFindMany,
  joinFindMany,
  messageFindMany,
  matchResultFindMany,
}

### Community 49 - "book/actions.ts"
Cohesion: 0.18
Nodes (11): requestBooking(), RequestBookingResult, canFit(), isExclusionViolation(), getDayGrid(), notifyBookingRequested(), {
  requireOnboardedUser,
  courtFindUnique,
  bookingCount,
  bookingCreate,
  clubStaffFindMany,
  getDayGrid,
  checkRateLimit,
  notifyBookingRequested,
  captureEvent,
  redirect,
}, STARTS_AT (+3 more)

### Community 50 - "@sentry/nextjs"
Cohesion: 0.31
Nodes (6): onRequestError, register(), scrubEvent(), nextConfig, withNextIntl, @sentry/nextjs

### Community 53 - "options.ts"
Cohesion: 0.36
Nodes (5): NTRP_LEVELS, NTRP_MAX, NTRP_MIN, NTRP_STEP, STARTING_ELO

### Community 54 - "result-form.tsx"
Cohesion: 0.24
Nodes (7): ActionResult, ErrorText(), FieldErrorLike, GamesRow(), ResultForm(), MatchScoreInput, @hookform/resolvers

### Community 55 - "Court booking v1: request-based booking for SpinBuddy-owned availability at partner clubs, no payments, no sync with external booking systems (Slice K)"
Cohesion: 0.33
Nodes (4): AGENTS.md §1 Project in one paragraph, AGENTS.md §9 Boundaries, EU sui generis database right (Directive 96/9/EC), Court Booking Epic (Slice K) — Session Prompts

### Community 58 - "autoblock.ts"
Cohesion: 0.48
Nodes (5): AUTOBLOCK_THRESHOLD, AUTOBLOCK_WINDOW_DAYS, maybeAutoblock(), shouldAutoblock(), { reportFindMany, userUpdateMany, adminActionCreate }

### Community 60 - "requireOnboardedUser"
Cohesion: 0.21
Nodes (6): MemberLayout(), NewOfferPage(), EditProfilePage(), ExportDataPage(), NotificationSettingsPage(), requireOnboardedUser

### Community 61 - "book/page.tsx"
Cohesion: 0.20
Nodes (14): addDays(), BookPage(), BookPageProps, dateOptions(), generateMetadata(), hrefWith(), Params, parseDate() (+6 more)

### Community 62 - "AGENTS.md §8 Git workflow"
Cohesion: 0.50
Nodes (3): AGENTS.md §8 Git workflow, booking-epic integration branch workflow, Session 16 — Partner integration (separate epic)

### Community 66 - "lint-staged"
Cohesion: 0.67
Nodes (3): lint-staged, *.{json,css,yaml,yml}, *.{ts,tsx,mts,js,mjs}

### Community 120 - "db.ts"
Cohesion: 0.22
Nodes (7): linkClubStaff(), LinkClubStaffResult, db, globalForPrisma, main(), usageError(), { userFindUnique, clubFindUnique, clubStaffUpsert }

### Community 121 - "match-result.ts"
Cohesion: 0.21
Nodes (11): gamesSchema(), isValidRegularSet(), isValidSet(), isValidSuperTiebreak(), matchScoreSchema(), MatchScoreValues, SetOutcome, setScoreSchema() (+3 more)

### Community 122 - "consent.ts"
Cohesion: 0.22
Nodes (4): CURRENT_CONSENT_VERSION, needsConsent(), complete, { findUnique, redirect }

### Community 123 - "auto-confirm.ts"
Cohesion: 0.26
Nodes (7): GET(), RESULT_AUTO_CONFIRMED_MESSAGE, autoConfirmExpiredResults(), { autoConfirmExpiredResults, runNotificationReminders }, { matchResultFindMany, postSystemMessage, tx }, pendingNoShowReport, pendingResult

### Community 124 - "callback/route.ts"
Cohesion: 0.27
Nodes (7): GET(), CallbackParams, otpTypeSchema, parseCallbackParams(), ensureUserRow(), parse(), { upsert }

### Community 125 - "app/layout.tsx"
Cohesion: 0.25
Nodes (6): geistMono, geistSans, RootLayout(), viewport, RegisterServiceWorker(), SiteFooter()

### Community 126 - "club-panel.ts"
Cohesion: 0.29
Nodes (9): AddBlockInput, addBlockSchema(), AddBlockValues, CLUB_PANEL_REASON_MAX, declineReasonSchema(), emptyToUndefined(), localDateTime(), reasonSchema() (+1 more)

### Community 127 - "login/page.tsx"
Cohesion: 0.33
Nodes (5): LoginPage(), LoginPageProps, isPublicRoute(), PUBLIC_ROUTES, safeNextPath()

### Community 128 - "krakow-time.ts"
Cohesion: 0.46
Nodes (6): daysAhead(), Formatter, krakowHour(), krakowLocalToDate(), krakowParts, toKrakowLocal()

### Community 129 - "send-push.ts"
Cohesion: 0.32
Nodes (7): ensureVapidConfigured(), isExpired(), PushPayload, PushSubscriptionKeys, sendPush(), SendPushOutcome, web-push

### Community 130 - "messages_en"
Cohesion: 0.29
Nodes (4): keyPaths(), main(), Messages, en

### Community 131 - "vitest"
Cohesion: 0.25
Nodes (4): vitest, { messageCreate }, LATER, NOW

### Community 132 - "send.ts"
Cohesion: 0.40
Nodes (5): getClient(), sendEmail(), SendEmailInput, SendEmailOutcome, resend

## Knowledge Gaps
- **43 isolated node(s):** `@prisma/client`, `react-dom`, `@tailwindcss/postcss`, `@types/leaflet`, `@types/node` (+38 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 587 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **63 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next-intl` connect `next-intl` to `krakow-time.ts`, `lib_generated_prisma_enums`, `messages_en`, `result-actions.ts`, `admin/actions.ts`, `club-list.tsx`, `AGENTS.md §2 Stack`, `language-switcher.tsx`, `translator.ts`, `next`, `offers/[id]/actions.ts`, `package.json`, `login-form.tsx`, `profile-form.tsx`, `report-actions.ts`, `profile.ts`, `[clubId]/page.tsx`, `new/actions.ts`, `offer-form.tsx`, `zod`, `require-user.ts`, `buttonVariants`, `unsubscribe/page.tsx`, `avatar-upload.tsx`, `[clubId]/actions.ts`, `notify.ts`, `Button`, `delete/actions.ts`, `book/actions.ts`, `@sentry/nextjs`, `result-form.tsx`, `requireOnboardedUser`, `book/page.tsx`, `consent.ts`, `app/layout.tsx`, `login/page.tsx`?**
  _High betweenness centrality (0.198) - this node is a cross-community bridge._
- **What connects `@prisma/client`, `react-dom`, `@tailwindcss/postcss` to the rest of the system?**
  _43 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `next-intl` be split into smaller, more focused modules?**
  _Cohesion score 0.051648351648351645 - nodes in this community are weakly interconnected._
- **Why does `vitest` connect `vitest` to `krakow-time.ts`, `lib_generated_prisma_enums`, `next-intl`, `result-actions.ts`, `admin/actions.ts`, `availability.ts`, `club-list.tsx`, `offer-interest.ts`, `messages_en`, `translator.ts`, `club.ts`, `offers/[id]/actions.ts`, `package.json`, `login-form.tsx`, `report-actions.ts`, `profile.ts`, `[clubId]/page.tsx`, `new/actions.ts`, `join-rules.ts`, `captureEvent`, `offer-form.tsx`, `zod`, `require-user.ts`, `reliability.ts`, `app/offers/actions.test.ts`, `buttonVariants`, `sendMessage`, `unsubscribe/page.tsx`, `avatar-upload.tsx`, `[clubId]/actions.ts`, `notify.test.ts`, `createSupabaseServerClient`, `booking.ts`, `notify`, `delete/actions.ts`, `export-user-data.ts`, `book/actions.ts`, `@sentry/nextjs`, `options.ts`, `autoblock.ts`, `db.ts`, `match-result.ts`, `consent.ts`, `auto-confirm.ts`, `callback/route.ts`, `club-panel.ts`, `login/page.tsx`?**
  _High betweenness centrality (0.172) - this node is a cross-community bridge._
- **Should `lib_generated_prisma_enums` be split into smaller, more focused modules?**
  _Cohesion score 0.057342657342657345 - nodes in this community are weakly interconnected._
- **Why does `Zod` connect `AGENTS.md §2 Stack` to `Offer/chat model: author is not a join row; players-needed computed from format+hasPartner, not stored; two thread kinds (private per-join, group per doubles offer) with no separate thread table (task 3.1)`?**
  _High betweenness centrality (0.092) - this node is a cross-community bridge._
- **Should `supabase-admin.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07404426559356136 - nodes in this community are weakly interconnected._