# Graph Report - tennisApp  (2026-10-30)

## Corpus Check
- 32 files · ~175,630 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1671 nodes · 4183 edges · 130 communities (67 shown, 63 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 74 edges (avg confidence: 0.83)
- Token cost: 96,096 input · 0 output

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
- Offer/chat model: author is not a join row; players-needed computed from format+hasPartner, not stored; two thread kinds (private per-join, group per doubles offer) with no separate thread table (task 3.1)
- book/actions.ts
- @sentry/nextjs
- ELO rating system
- Base DB schema: snake_case naming, UUID ids, enum statuses, cascade/restrict delete rules (task 0.12)
- options.ts
- result-form.tsx
- Court booking v1: request-based booking for SpinBuddy-owned availability at partner clubs, no payments, no sync with external booking systems (Slice K)
- messages table: one row per message, exactly one of offer_join_id/offer_id set, SELECT policy via a SECURITY DEFINER function in a private (non-API) schema — the first policy that opens public reads for authenticated (task 3.15)
- New PushSubscription table, notification-preference columns on User, and a new users.email mirror column synced by ensureUserRow on every login (tasks 5.3, 5.15, 5.16)
- Env vars set only in Vercel dashboard; DATABASE_URL shared by Preview+Production until task 6.9; DIRECT_URL not added to Vercel (task 0.18)
- book/page.tsx
- AGENTS.md §8 Git workflow
- Login: magic link + Google OAuth, no passwords
- engines
- Email in Resend test mode until own domain exists
- lint-staged
- vercel.json
- Minimum registration age 16 (superseded 2026-10-14)
- ESLint strictTypeChecked + no-console ban except warn/error (task 0.8)
- Dev seed implemented as plain prisma/seed.sql, not TypeScript
- avatar_path stores a bucket path (not full URL); each upload gets a random filename; saveAvatar() verifies path+existence before deleting the old file (task 1.14a)
- Club schema: surfaces as array enum, indoor NONE/YEAR_ROUND/WINTER_BUBBLE, slug as stable load key, verified_at date (task 2.1)
- /clubs: server-rendered list + map, client-only ClubsView switches List/Map on mobile via CSS visibility, ResizeObserver->invalidateSize() (task 2.6)
- Cron: daily Vercel Cron Job for auto-confirmation now; hourly reminders will reuse the same /api/cron via a GitHub Actions schedule workflow, not Supabase pg_cron/pg_net (task 5.8)
- /terms and /privacy are public draft placeholder pages with a banner and a dated CURRENT_CONSENT_VERSION; onboarding adds a consent checkbox; existing users are re-gated to /consent when the version changes (tasks 6.11, 6.12)
- AGENTS.md §7 Testing instructions
- CI workflow (ci.yml)
- UI language: English only, no i18n yet
- next.config.ts sets agentRules:false (task 0.4)
- Pre-commit hook: husky + lint-staged, auto-fix only changed files (task 0.9)
- Prettier default settings, markdown excluded, LF via .gitattributes (task 0.7)
- proxy.ts (middleware) allows only an explicit PUBLIC_ROUTES allowlist, everything else redirects to /login (task 1.4)
- Players without a completed profile are redirected to /onboarding via the app/(member)/ route group layout calling requireOnboardedUser() (task 1.12b)
- Maskable App Icon (512px)
- Next.js Logo Icon
- sw.js
- Vercel Logo Icon
- Window Icon (Next.js default)
- db.ts
- match-result.ts
- consent.ts
- auto-confirm.ts
- callback/route.ts
- app/layout.tsx
- club-panel.ts
- krakow-time.ts
- send-push.ts

## God Nodes (most connected - your core abstractions)
1. `vitest` - 97 edges
2. `next-intl` - 94 edges
3. `next` - 79 edges
4. `db` - 51 edges
5. `Button()` - 46 edges
6. `react` - 44 edges
7. `requireOnboardedUser` - 37 edges
8. `buttonVariants` - 32 edges
9. `zod` - 31 edges
10. `getCurrentUser()` - 26 edges

## Surprising Connections (you probably didn't know these)
- `rejectSubmission(id, reason?) action` --references--> `requireAdmin`  [EXTRACTED]
  docs/TIER1-FEATURES.md → lib/auth/require-admin.ts
- `Hide/unhide an offer (Slice N)` --references--> `feedWhere()`  [EXTRACTED]
  docs/TIER1-FEATURES.md → lib/offers/feed-filters.ts
- `OfferDismissal Prisma model` --shares_data_with--> `feedWhere()`  [EXTRACTED]
  docs/TIER1-FEATURES.md → lib/offers/feed-filters.ts
- `Hide/unhide an offer (Slice N)` --references--> `OfferCard()`  [EXTRACTED]
  docs/TIER1-FEATURES.md → components/offer-card.tsx
- `get-leaderboard server loader` --shares_data_with--> `computeReliability()`  [EXTRACTED]
  docs/TIER1-FEATURES.md → lib/rating/reliability.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Slice-Based Session Workflow** — docs_planning, docs_prompts_00_readme, docs_prompts_01_session_audit_and_offer, docs_prompts_02_session_join_flow, docs_prompts_03_session_chat, docs_prompts_04_session_results_and_elo, docs_prompts_05_session_reliability, docs_prompts_06_session_courts_and_booking, docs_prompts_07_session_pwa_and_notifications, docs_prompts_08_session_safety_and_admin, docs_prompts_09_session_polish_and_profile_photo, docs_prompts_10_session_launch_readiness [EXTRACTED 1.00]
- **Court booking epic branch workflow overriding standard AGENTS.md git process** — docs_booking_epic_branch_workflow, agents_section8_git_workflow, agents_decisions_20261021_booking_v1_decision [INFERRED 0.85]
- **RLS deny-by-default evolution across the schema** — agents_decisions_20260929_rls_enabled_no_policies, agents_decisions_20261003_rls_strategy_with_prisma, agents_decisions_20261004_rls_e2e_test, agents_decisions_20261012_messages_model_first_rls [INFERRED 0.85]
- **Tech stack defined consistently across AGENTS.md, README and decisions.md** — agents_decisions_20260920_project_stack, agents_section2_stack, readme_stack_glossary [INFERRED 0.85]
- **Three Tier-1 slices sharing a common session preamble** — docs_tier1_features_leaderboard_v1, docs_tier1_features_club_submission_feature, docs_tier1_features_hide_undo_offer, docs_tier1_features_shared_preamble [EXTRACTED 1.00]
- **Club submission admin review flow** — app_admin_club_submissions_page_clubsubmissionspage, app_admin_club_submissions_actions_approvesubmission, app_admin_club_submissions_actions_rejectsubmission, lib_auth_require_admin_requireadmin [EXTRACTED 1.00]
- **Hide/unhide offer flow** — lib_offers_dismissals_actions_dismissoffer, components_offer_card_offercard, app_offers_hidden_page_hiddenofferspage, lib_offers_feed_filters_feedwhere [EXTRACTED 1.00]

## Communities (130 total, 63 thin omitted)

### Community 0 - "next-intl"
Cohesion: 0.05
Nodes (63): OffersPage(), OfferCard(), OfferFilters(), daysAhead(), eloDistance(), RankableOffer, rankByEloCloseness(), DEFAULT_OFFER_DURATION (+55 more)

### Community 1 - "lib_generated_prisma_enums"
Cohesion: 0.07
Nodes (35): admin, PNG, admin, created, PNG, signedInClient(), far, near (+27 more)

### Community 2 - "supabase-admin.ts"
Cohesion: 0.07
Nodes (40): Card(), ProfilePage(), SettingsLink(), generateMetadata(), PlayerPage(), PlayerPageProps, MatchHistory(), ProfileHero() (+32 more)

### Community 3 - "result-actions.ts"
Cohesion: 0.07
Nodes (37): reportMessage(), reportOffer(), reportPlayer(), AUTOBLOCK_THRESHOLD, AUTOBLOCK_WINDOW_DAYS, maybeAutoblock(), shouldAutoblock(), createReport() (+29 more)

### Community 4 - "admin/actions.ts"
Cohesion: 0.05
Nodes (45): .agents/decisions.md decisions log, AGENTS.md (single source of truth), approveSubmission(id) action, rejectSubmission(id, reason?) action, submitClub(input) action, Leaderboard page (Server Component), Hidden offers view / Unhide, CLAUDE.md project instructions (+37 more)

### Community 5 - "availability.ts"
Cohesion: 0.10
Nodes (37): ActionResult, notificationSettingsSchema, removePushSubscription(), savePushSubscription(), updateNotificationSetting(), NotificationSettings, NotificationSettingsForm(), toggle() (+29 more)

### Community 6 - "club-list.tsx"
Cohesion: 0.09
Nodes (25): geistMono, geistSans, RootLayout(), viewport, LanguageSwitcher(), choose(), RegisterServiceWorker(), SiteFooter() (+17 more)

### Community 7 - "offer-interest.ts"
Cohesion: 0.09
Nodes (30): sendMessage(), ACCEPT, AvatarUpload(), choose(), reset(), save(), GoogleSignInButton(), signIn() (+22 more)

### Community 8 - "AGENTS.md §2 Stack"
Cohesion: 0.10
Nodes (30): confirmResult(), disputeResult(), ErrorsT, loadSubmittableJoin(), PendingResult, SettleAction, SettleOutcome, settleResult() (+22 more)

### Community 9 - "language-switcher.tsx"
Cohesion: 0.13
Nodes (23): AGENTS.md §2 Stack, GitHub Actions (CI), Next.js, OpenStreetMap, Playwright, pnpm, PostHog EU, Prisma ORM (+15 more)

### Community 10 - "translator.ts"
Cohesion: 0.13
Nodes (27): AdminActionResult, annulDisputedResult(), blockFromReport(), confirmDisputedResult(), dismissReport(), hideReport(), logAction(), unblockPlayer() (+19 more)

### Community 11 - "club.ts"
Cohesion: 0.15
Nodes (22): AddBlockResult, aria(), ClubOption, ErrorText(), Field(), FieldErrorLike, NtrpSelect(), OfferForm() (+14 more)

### Community 12 - "PLANNING.md (v2)"
Cohesion: 0.09
Nodes (23): upsertClubs(), ClubRecord, clubSchema, CourtHoursRecord, courtHoursRecordSchema, CourtRecord, courtRecordSchema, describe() (+15 more)

### Community 13 - "next"
Cohesion: 0.12
Nodes (10): MemberLayout(), NewOfferPage(), DeleteAccountPage(), EditProfilePage(), ExportDataPage(), NotificationSettingsPage(), requireOnboardedUser, db (+2 more)

### Community 14 - "offers/[id]/actions.ts"
Cohesion: 0.15
Nodes (18): OfferPage(), OfferPageProps, PlayerView(), JoinThread(), OfferActionButton(), AuthorView(), OfferBookingSection(), PlayerLink() (+10 more)

### Community 15 - "package.json"
Cohesion: 0.14
Nodes (19): Home(), ClubFiltersForm(), ClubList(), ClubListEntry(), ClubListItem, ClubMapMarker, ClubMap(), ClubMapClient (+11 more)

### Community 16 - "login-form.tsx"
Cohesion: 0.14
Nodes (29): MEMORY.md (agent working notes), AGENTS.md — SpinBuddy Agent Rules, decisions.md — Architecture Decision Log, Claude Code Planning Prompt, PLANNING-v1.md (archived), Launch Checklist — MatchFinder Kraków, PLANNING.md (v2), Slice A — Sync and Process Lightening (+21 more)

### Community 17 - "profile-form.tsx"
Cohesion: 0.14
Nodes (20): saveAvatar(), SaveAvatarResult, updateProfile(), completeOnboarding(), avatarPathSchema(), STARTING_ELO, startingElo(), MIN_AGE (+12 more)

### Community 18 - "report-actions.ts"
Cohesion: 0.08
Nodes (25): eslintConfig, name, packageManager, private, version, class-variance-authority, eslint, eslint-config-next (+17 more)

### Community 19 - "components.json"
Cohesion: 0.13
Nodes (10): ErrorPage(), ActionResult, ErrorText(), FieldErrorLike, GamesRow(), ResultForm(), Button(), Input() (+2 more)

### Community 20 - "dependencies"
Cohesion: 0.14
Nodes (20): acceptJoin(), cancelOffer(), changeJoin(), declineJoin(), JoinChangeResult, requestToJoin(), RequestToJoinResult, SendMessageResult (+12 more)

### Community 21 - "devDependencies"
Cohesion: 0.16
Nodes (16): markNotificationsReadAction(), offerIdSchema, unreadNotificationCount(), NotificationsPage(), MarkNotificationsRead(), NOTIFICATIONS_CHANGED_EVENT, countUnreadNotifications(), InboxNotification (+8 more)

### Community 22 - "profile.ts"
Cohesion: 0.14
Nodes (11): ClubStaffSession, AuthRequiredError, getCurrentUser(), SessionUser, vitest, { getCurrentUser, create }, { requireUser, update, redirect, captureEvent }, valid (+3 more)

### Community 23 - "[clubId]/page.tsx"
Cohesion: 0.13
Nodes (12): getJoinThread(), ThreadMessage, canWriteToThread(), isJoinThreadParticipant(), canCancelOffer(), joinRefusal, JOIN, STARTS_AT (+4 more)

### Community 24 - "new/actions.ts"
Cohesion: 0.16
Nodes (9): giveConsent(), ConsentPage(), OnboardingPage(), requireUser(), CURRENT_CONSENT_VERSION, needsConsent(), { update, redirect }, complete (+1 more)

### Community 25 - "join-rules.ts"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 26 - "captureEvent"
Cohesion: 0.13
Nodes (15): BookingGroup(), MyBookings(), STATUS_STYLE, BOOKING_CANCEL_WINDOW_HOURS, canCancelBooking(), BookingRow, bookingSelect, getMyBookings() (+7 more)

### Community 27 - "offer-form.tsx"
Cohesion: 0.15
Nodes (18): BLOCKING_BOOKING_STATUSES, BlockingBookingStatus, BookingInput, buildDayGrid(), BuildDayGridInput, buildDayWindows(), canFit(), CourtBlockInput (+10 more)

### Community 28 - "compilerOptions"
Cohesion: 0.13
Nodes (18): getClient(), sendEmail(), SendEmailInput, SendEmailOutcome, EmailTemplateInput, escapeHtml(), renderEmailHtml(), renderEmailText() (+10 more)

### Community 29 - "zod"
Cohesion: 0.09
Nodes (22): dependencies, @base-ui/react, class-variance-authority, cn, @hookform/resolvers, leaflet, lucide-react, next (+14 more)

### Community 30 - "require-user.ts"
Cohesion: 0.09
Nodes (22): devDependencies, eslint, eslint-config-next, eslint-config-prettier, husky, lint-staged, @playwright/test, prettier (+14 more)

### Community 31 - "reliability.ts"
Cohesion: 0.18
Nodes (13): recordOutboundClick(), ClubPage(), ClubPageProps, generateMetadata(), BookingLink(), track(), ExternalLink(), ClubDetails (+5 more)

### Community 32 - "app/offers/actions.test.ts"
Cohesion: 0.19
Nodes (9): signOut(), GET(), ensureUserRow(), supabaseEnv(), createSupabaseServerClient(), @supabase/ssr, { upsert }, jar (+1 more)

### Community 33 - "buttonVariants"
Cohesion: 0.21
Nodes (16): addDays(), ClubPanelPage(), metadata, AddBlockForm(), requireClubStaff, blockForSlot(), bookingForSlot(), ClubPanelDay (+8 more)

### Community 34 - "sendMessage"
Cohesion: 0.18
Nodes (15): ClubMap(), ClubMapProps, FIT_PADDING, FitToContainer(), KRAKOW_CENTER, ShowClubPickedInList(), markerIconDefault, ClubSelection (+7 more)

### Community 35 - "unsubscribe/page.tsx"
Cohesion: 0.17
Nodes (15): ACTION_ACTOR, JoinAction, joinChangeRefusal, nextJoinStatus(), OfferState, offerStatusFor(), TRANSITIONS, playersNeeded() (+7 more)

### Community 36 - "avatar-upload.tsx"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 37 - "[clubId]/actions.ts"
Cohesion: 0.21
Nodes (9): AccountDeletedPage(), HeaderNavLinks(), isActive(), NavLink, MyGames(), NotificationBell(), SiteHeader(), buttonVariants (+1 more)

### Community 38 - "notify.test.ts"
Cohesion: 0.21
Nodes (14): DAILY_OFFER_PUSH_LIMIT, hasDailyCapacity(), interestedCandidates(), isInterestedIn(), isQuietHours(), levelMatches(), NewOfferInfo, NTRP_MATCH_TOLERANCE (+6 more)

### Community 39 - "scripts"
Cohesion: 0.15
Nodes (15): BOOKING_DURATIONS, BOOKING_FIELDS, BOOKING_MAX_DAYS_AHEAD, BOOKING_NOTE_MAX, BookingRequestInput, bookingRequestSchema(), BookingRequestValues, CreateBookingResult (+7 more)

### Community 40 - "createSupabaseServerClient"
Cohesion: 0.22
Nodes (11): createOffer(), blockedRefusal(), notifyInterestedPlayers(), toCandidate(), activeOffersWhere(), MAX_ACTIVE_OFFERS, checkRateLimit(), offerFieldErrors() (+3 more)

### Community 41 - "notify.ts"
Cohesion: 0.20
Nodes (12): sendMagicLink(), SendMagicLinkResult, LoginForm(), onSubmit(), loginSchema(), LoginValues, magicLinkRequestSchema(), ValidationT (+4 more)

### Community 42 - "Button"
Cohesion: 0.25
Nodes (10): confirmUnsubscribe(), UnsubscribeResult, UnsubscribePage(), UnsubscribePageProps, UnsubscribeButton(), createUnsubscribeToken(), secret(), sign() (+2 more)

### Community 43 - "Session 11 — Decision + data model (K.1-K.5)"
Cohesion: 0.12
Nodes (16): scripts, build, check:i18n-keys, check:i18n-strings, clubs:load, dev, format, format:check (+8 more)

### Community 44 - "booking.ts"
Cohesion: 0.21
Nodes (10): cancelBooking(), requestBooking(), RequestBookingResult, isExclusionViolation(), notifyBookingCancelled(), notifyBookingRequested(), PENDING_BOOKING, {
  requireOnboardedUser,
  courtFindUnique,
  bookingCount,
  bookingCreate,
  bookingFindUnique,
  bookingUpdate,
  offerFindUnique,
  clubStaffFindMany,
  getDayGrid,
  checkRateLimit,
  notifyBookingRequested,
  notifyBookingCancelled,
  captureEvent,
  redirect,
} (+2 more)

### Community 45 - "notify"
Cohesion: 0.23
Nodes (12): BookingGrid(), Formatter, LEGEND_SWATCH, overlapsRange(), T, timeLabel(), DaySlot, SlotStatus (+4 more)

### Community 46 - "delete/actions.ts"
Cohesion: 0.24
Nodes (9): MobileNav(), NavLink, Sheet(), SheetContent(), SheetOverlay(), SheetPortal(), SheetTitle(), SheetTrigger() (+1 more)

### Community 47 - "export-user-data.ts"
Cohesion: 0.24
Nodes (11): addBlock(), ClubPanelActionResult, confirmBooking(), declineBooking(), overlapsABooking(), removeBlock(), markCourtBooked(), bookingDurationMinutes() (+3 more)

### Community 48 - "Offer/chat model: author is not a join row; players-needed computed from format+hasPartner, not stored; two thread kinds (private per-join, group per doubles offer) with no separate thread table (task 3.1)"
Cohesion: 0.24
Nodes (11): addDays(), BookPage(), BookPageProps, dateOptions(), hrefWith(), Params, parseDate(), parseDuration() (+3 more)

### Community 49 - "book/actions.ts"
Cohesion: 0.22
Nodes (8): LoginPage(), LoginPageProps, CallbackParams, otpTypeSchema, parseCallbackParams(), PUBLIC_ROUTES, safeNextPath(), parse()

### Community 50 - "@sentry/nextjs"
Cohesion: 0.21
Nodes (10): AnalyticsEvent, EventProperties, OfferFormat, OutboundTarget, PropertiesFor, BANNED_PROPERTY_KEYS, captureEvent(), getClient() (+2 more)

### Community 51 - "ELO rating system"
Cohesion: 0.25
Nodes (7): applyMatchElo(), applyMatchEloFromJoin(), PendingResultJoin, computeEloChange(), expectedScore(), kFactor(), MatchOutcome

### Community 52 - "Base DB schema: snake_case naming, UUID ids, enum statuses, cascade/restrict delete rules (task 0.12)"
Cohesion: 0.26
Nodes (8): Admin club-submissions review queue page, exportMyData(), ExportDataButton(), download(), exportUserData(), UserDataExport, firstNameAndInitial(), {
  userFindUniqueOrThrow,
  offerFindMany,
  joinFindMany,
  messageFindMany,
  matchResultFindMany,
}

### Community 53 - "options.ts"
Cohesion: 0.32
Nodes (6): deleteMyAccount(), deleteAccountStorageAndAuth(), redactAccountData(), createSupabaseAdminClient(), {
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

### Community 54 - "result-form.tsx"
Cohesion: 0.21
Nodes (13): Booking (booking schema entity), Club.bookingMode enum (EXTERNAL_LINK / SPINBUDDY), ClubStaff (booking schema entity), Court (booking schema entity), CourtBlock (booking schema entity), CourtHours (booking schema entity), Session 0 — Epic setup, Session 11 — Decision + data model (K.1-K.5) (+5 more)

### Community 55 - "Court booking v1: request-based booking for SpinBuddy-owned availability at partner clubs, no payments, no sync with external booking systems (Slice K)"
Cohesion: 0.31
Nodes (6): onRequestError, register(), scrubEvent(), nextConfig, withNextIntl, @sentry/nextjs

### Community 56 - "messages table: one row per message, exactly one of offer_join_id/offer_id set, SELECT policy via a SECURITY DEFINER function in a private (non-API) schema — the first policy that opens public reads for authenticated (task 3.15)"
Cohesion: 0.35
Nodes (11): notify(), notifyBookingDecided(), autoDeclinePendingBookings(), krakowTimeRangeLabel(), ReminderCounts, runNotificationReminders(), sendHowDidItGoPrompts(), sendMatchReminders() (+3 more)

### Community 57 - "New PushSubscription table, notification-preference columns on User, and a new users.email mirror column synced by ensureUserRow on every login (tasks 5.3, 5.15, 5.16)"
Cohesion: 0.26
Nodes (7): GET(), RESULT_AUTO_CONFIRMED_MESSAGE, autoConfirmExpiredResults(), { autoConfirmExpiredResults, runNotificationReminders }, { matchResultFindMany, postSystemMessage, tx }, pendingNoShowReport, pendingResult

### Community 61 - "book/page.tsx"
Cohesion: 0.31
Nodes (5): linkClubStaff(), LinkClubStaffResult, main(), usageError(), { userFindUnique, clubFindUnique, clubStaffUpsert }

### Community 62 - "AGENTS.md §8 Git workflow"
Cohesion: 0.22
Nodes (7): { createUnsubscribeToken }, NOW, { recordNotification }, { sendEmail }, { sendPush }, SUB, { userFindUnique, pushSubscriptionDelete, offerJoinUpdateMany }

### Community 63 - "Login: magic link + Google OAuth, no passwords"
Cohesion: 0.32
Nodes (7): ensureVapidConfigured(), isExpired(), PushPayload, PushSubscriptionKeys, sendPush(), SendPushOutcome, web-push

### Community 64 - "engines"
Cohesion: 0.33
Nodes (4): AGENTS.md §1 Project in one paragraph, AGENTS.md §9 Boundaries, EU sui generis database right (Directive 96/9/EC), Court Booking Epic (Slice K) — Session Prompts

### Community 67 - "vercel.json"
Cohesion: 0.48
Nodes (3): MarkMeaningfulAction(), hasMeaningfulAction(), markMeaningfulAction()

### Community 69 - "ESLint strictTypeChecked + no-console ban except warn/error (task 0.8)"
Cohesion: 0.50
Nodes (3): AGENTS.md §8 Git workflow, booking-epic integration branch workflow, Session 16 — Partner integration (separate epic)

### Community 71 - "avatar_path stores a bucket path (not full URL); each upload gets a random filename; saveAvatar() verifies path+existence before deleting the old file (task 1.14a)"
Cohesion: 0.40
Nodes (3): NOW, OFFER, { userFindMany, userUpdate, notify }

### Community 73 - "/clubs: server-rendered list + map, client-only ClubsView switches List/Map on mobile via CSS visibility, ResizeObserver->invalidateSize() (task 2.6)"
Cohesion: 0.50
Nodes (3): getDayGrid(), CLUB_ROW, { findFirst, findBookings, findBlocks }

### Community 75 - "/terms and /privacy are public draft placeholder pages with a banner and a dated CURRENT_CONSENT_VERSION; onboarding adds a consent checkbox; existing users are re-gated to /consent when the version changes (tasks 6.11, 6.12)"
Cohesion: 0.67
Nodes (3): lint-staged, *.{json,css,yaml,yml}, *.{ts,tsx,mts,js,mjs}

## Knowledge Gaps
- **68 isolated node(s):** `husky`, `lint-staged`, `prettier`, `@prisma/client`, `react-dom` (+63 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 624 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **63 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next-intl` connect `components.json` to `next-intl`, `supabase-admin.ts`, `result-actions.ts`, `availability.ts`, `club-list.tsx`, `offer-interest.ts`, `AGENTS.md §2 Stack`, `language-switcher.tsx`, `translator.ts`, `club.ts`, `next`, `offers/[id]/actions.ts`, `package.json`, `profile-form.tsx`, `report-actions.ts`, `dependencies`, `devDependencies`, `new/actions.ts`, `captureEvent`, `compilerOptions`, `reliability.ts`, `buttonVariants`, `sendMessage`, `[clubId]/actions.ts`, `createSupabaseServerClient`, `notify.ts`, `Button`, `booking.ts`, `notify`, `delete/actions.ts`, `export-user-data.ts`, `Offer/chat model: author is not a join row; players-needed computed from format+hasPartner, not stored; two thread kinds (private per-join, group per doubles offer) with no separate thread table (task 3.1)`, `book/actions.ts`, `options.ts`, `Court booking v1: request-based booking for SpinBuddy-owned availability at partner clubs, no payments, no sync with external booking systems (Slice K)`?**
  _High betweenness centrality (0.224) - this node is a cross-community bridge._
- **What connects `husky`, `lint-staged`, `prettier` to the rest of the system?**
  _68 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `next-intl` be split into smaller, more focused modules?**
  _Cohesion score 0.05078855920876771 - nodes in this community are weakly interconnected._
- **Why does `vitest` connect `profile.ts` to `next-intl`, `supabase-admin.ts`, `result-actions.ts`, `availability.ts`, `club-list.tsx`, `offer-interest.ts`, `AGENTS.md §2 Stack`, `translator.ts`, `PLANNING.md (v2)`, `next`, `offers/[id]/actions.ts`, `package.json`, `profile-form.tsx`, `report-actions.ts`, `dependencies`, `devDependencies`, `[clubId]/page.tsx`, `new/actions.ts`, `captureEvent`, `offer-form.tsx`, `reliability.ts`, `app/offers/actions.test.ts`, `buttonVariants`, `unsubscribe/page.tsx`, `[clubId]/actions.ts`, `notify.test.ts`, `scripts`, `createSupabaseServerClient`, `notify.ts`, `Button`, `booking.ts`, `notify`, `export-user-data.ts`, `book/actions.ts`, `@sentry/nextjs`, `ELO rating system`, `Base DB schema: snake_case naming, UUID ids, enum statuses, cascade/restrict delete rules (task 0.12)`, `options.ts`, `Court booking v1: request-based booking for SpinBuddy-owned availability at partner clubs, no payments, no sync with external booking systems (Slice K)`, `messages table: one row per message, exactly one of offer_join_id/offer_id set, SELECT policy via a SECURITY DEFINER function in a private (non-API) schema — the first policy that opens public reads for authenticated (task 3.15)`, `New PushSubscription table, notification-preference columns on User, and a new users.email mirror column synced by ensureUserRow on every login (tasks 5.3, 5.15, 5.16)`, `book/page.tsx`, `AGENTS.md §8 Git workflow`, `vercel.json`, `Dev seed implemented as plain prisma/seed.sql, not TypeScript`, `avatar_path stores a bucket path (not full URL); each upload gets a random filename; saveAvatar() verifies path+existence before deleting the old file (task 1.14a)`, `/clubs: server-rendered list + map, client-only ClubsView switches List/Map on mobile via CSS visibility, ResizeObserver->invalidateSize() (task 2.6)`?**
  _High betweenness centrality (0.132) - this node is a cross-community bridge._
- **Should `lib_generated_prisma_enums` be split into smaller, more focused modules?**
  _Cohesion score 0.07404426559356136 - nodes in this community are weakly interconnected._
- **Why does `next` connect `next` to `next-intl`, `supabase-admin.ts`, `availability.ts`, `club-list.tsx`, `offer-interest.ts`, `AGENTS.md §2 Stack`, `translator.ts`, `club.ts`, `offers/[id]/actions.ts`, `package.json`, `profile-form.tsx`, `report-actions.ts`, `components.json`, `dependencies`, `devDependencies`, `profile.ts`, `new/actions.ts`, `captureEvent`, `reliability.ts`, `app/offers/actions.test.ts`, `buttonVariants`, `sendMessage`, `[clubId]/actions.ts`, `createSupabaseServerClient`, `notify.ts`, `Button`, `booking.ts`, `notify`, `delete/actions.ts`, `export-user-data.ts`, `Offer/chat model: author is not a join row; players-needed computed from format+hasPartner, not stored; two thread kinds (private per-join, group per doubles offer) with no separate thread table (task 3.1)`, `book/actions.ts`, `options.ts`, `Court booking v1: request-based booking for SpinBuddy-owned availability at partner clubs, no payments, no sync with external booking systems (Slice K)`, `New PushSubscription table, notification-preference columns on User, and a new users.email mirror column synced by ensureUserRow on every login (tasks 5.3, 5.15, 5.16)`?**
  _High betweenness centrality (0.086) - this node is a cross-community bridge._
- **Should `supabase-admin.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0726764500349406 - nodes in this community are weakly interconnected._