# Graph Report - tennisApp  (2026-10-22)

## Corpus Check
- 59 files · ~168,233 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1581 nodes · 4032 edges · 137 communities (73 shown, 64 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 72 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 11
- Community 12
- Community 13
- Community 14
- Community 15
- Community 16
- Community 17
- Community 18
- Community 19
- Community 20
- Community 21
- Community 22
- Community 23
- Community 24
- Community 25
- Community 26
- Community 27
- Community 28
- Community 29
- Community 30
- Community 31
- Community 32
- Community 33
- Community 34
- Community 35
- Community 36
- Community 37
- Community 38
- Community 39
- Community 40
- Community 41
- Community 42
- Community 43
- Community 44
- Community 45
- Community 46
- Community 47
- Community 48
- Community 49
- Community 50
- Community 51
- Community 52
- Community 53
- Community 54
- Community 55
- Community 56
- Community 57
- Community 58
- Community 59
- Community 61
- Community 62
- Community 63
- Community 64
- Community 66
- Community 67
- Community 68
- Community 69
- Community 70
- Community 71
- Community 72
- Community 73
- Community 74
- Community 75
- Community 76
- Community 77
- Community 78
- Community 79
- Community 80
- Community 81
- Community 82
- Community 83
- Community 85
- Community 91
- Community 92
- Community 93
- Community 94
- Community 95
- Community 96
- Community 119
- Community 123
- Community 124
- Community 125
- Community 126
- Community 127
- Community 128
- Community 129
- Community 130
- Community 131
- Community 132
- Community 133
- Community 135
- Community 136

## God Nodes (most connected - your core abstractions)
1. `vitest` - 94 edges
2. `next-intl` - 89 edges
3. `next` - 76 edges
4. `db` - 49 edges
5. `Button()` - 46 edges
6. `react` - 44 edges
7. `requireOnboardedUser` - 41 edges
8. `buttonVariants` - 34 edges
9. `zod` - 30 edges
10. `getCurrentUser()` - 27 edges

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

## Communities (137 total, 64 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (35): admin, PNG, admin, created, PNG, signedInClient(), far, near (+27 more)

### Community 1 - "Community 1"
Cohesion: 0.06
Nodes (46): GET(), confirmResult(), disputeResult(), ErrorsT, loadSubmittableJoin(), PendingResult, SettleAction, SettleOutcome (+38 more)

### Community 2 - "Community 2"
Cohesion: 0.07
Nodes (42): AdminResultsPage(), metadata, Card(), ProfilePage(), SettingsLink(), generateMetadata(), PlayerPage(), PlayerPageProps (+34 more)

### Community 3 - "Community 3"
Cohesion: 0.07
Nodes (38): recordOutboundClick(), Home(), BookingLink(), track(), ClubList(), ClubListEntry(), ClubListItem, ClubMap() (+30 more)

### Community 4 - "Community 4"
Cohesion: 0.11
Nodes (25): AccountDeletedPage(), markNotificationsReadAction(), offerIdSchema, unreadNotificationCount(), NotificationsPage(), HeaderNavLinks(), isActive(), NavLink (+17 more)

### Community 5 - "Community 5"
Cohesion: 0.13
Nodes (21): ErrorPage(), DeleteAccountPage(), AdminAction, AdminActionResult, GoogleSignInButton(), signIn(), MessageRow, MessageThread() (+13 more)

### Community 6 - "Community 6"
Cohesion: 0.13
Nodes (23): AGENTS.md §2 Stack, GitHub Actions (CI), Next.js, OpenStreetMap, Playwright, pnpm, PostHog EU, Prisma ORM (+15 more)

### Community 7 - "Community 7"
Cohesion: 0.15
Nodes (22): EditProfilePage(), AddBlockResult, ClubFiltersForm(), OfferFilters(), aria(), ClubOption, ErrorText(), Field() (+14 more)

### Community 8 - "Community 8"
Cohesion: 0.09
Nodes (23): upsertClubs(), ClubRecord, clubSchema, CourtHoursRecord, courtHoursRecordSchema, CourtRecord, courtRecordSchema, describe() (+15 more)

### Community 9 - "Community 9"
Cohesion: 0.13
Nodes (29): MEMORY.md (agent working notes), AGENTS.md — SpinBuddy Agent Rules, decisions.md — Architecture Decision Log, Claude Code Planning Prompt, PLANNING-v1.md (archived), Launch Checklist — MatchFinder Kraków, PLANNING.md (v2), Slice A — Sync and Process Lightening (+21 more)

### Community 10 - "Community 10"
Cohesion: 0.16
Nodes (25): removePushSubscription(), savePushSubscription(), initialStatus(), PushSubscribeControl(), disable(), enable(), Status, dismiss() (+17 more)

### Community 11 - "Community 11"
Cohesion: 0.13
Nodes (23): acceptJoin(), cancelOffer(), changeJoin(), declineJoin(), JoinChangeResult, markCourtBooked(), requestToJoin(), RequestToJoinResult (+15 more)

### Community 12 - "Community 12"
Cohesion: 0.13
Nodes (23): OffersPage(), FEED_PAGE_SIZE, FeedOffer, feedOfferSelect, FeedPage, FeedFilters, feedHref(), feedWhere() (+15 more)

### Community 13 - "Community 13"
Cohesion: 0.15
Nodes (21): AdminActionResult, annulDisputedResult(), blockFromReport(), confirmDisputedResult(), dismissReport(), hideReport(), logAction(), unblockPlayer() (+13 more)

### Community 14 - "Community 14"
Cohesion: 0.08
Nodes (25): eslintConfig, name, packageManager, private, version, class-variance-authority, eslint, eslint-config-next (+17 more)

### Community 15 - "Community 15"
Cohesion: 0.13
Nodes (20): BLOCKING_BOOKING_STATUSES, BlockingBookingStatus, BookingInput, buildDayGrid(), BuildDayGridInput, buildDayWindows(), canFit(), CourtBlockInput (+12 more)

### Community 16 - "Community 16"
Cohesion: 0.17
Nodes (15): addBlock(), ClubPanelActionResult, confirmBooking(), declineBooking(), durationMinutes(), overlapsABooking(), removeBlock(), ClubStaffSession (+7 more)

### Community 17 - "Community 17"
Cohesion: 0.17
Nodes (15): sendMagicLink(), SendMagicLinkResult, LoginPage(), LoginPageProps, LoginForm(), onSubmit(), safeNextPath(), loginSchema() (+7 more)

### Community 18 - "Community 18"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 19 - "Community 19"
Cohesion: 0.09
Nodes (22): dependencies, @base-ui/react, class-variance-authority, cn, @hookform/resolvers, leaflet, lucide-react, next (+14 more)

### Community 20 - "Community 20"
Cohesion: 0.09
Nodes (22): devDependencies, eslint, eslint-config-next, eslint-config-prettier, husky, lint-staged, @playwright/test, prettier (+14 more)

### Community 21 - "Community 21"
Cohesion: 0.16
Nodes (12): createOffer(), blockedRefusal(), activeOffersWhere(), MAX_ACTIVE_OFFERS, checkRateLimit(), RATE_LIMITS, RateLimitResult, offerFieldErrors() (+4 more)

### Community 22 - "Community 22"
Cohesion: 0.15
Nodes (16): DEFAULT_OFFER_DURATION, isOfferDuration(), OfferDuration, offerEndsAt(), COMMENT_MAX, CreateOfferResult, emptyToUndefined(), OFFER_FIELDS (+8 more)

### Community 23 - "Community 23"
Cohesion: 0.17
Nodes (7): giveConsent(), ConsentPage(), CURRENT_CONSENT_VERSION, needsConsent(), { update, redirect }, complete, { findUnique, redirect }

### Community 24 - "Community 24"
Cohesion: 0.23
Nodes (15): saveAvatar(), SaveAvatarResult, ACCEPT, AvatarUpload(), choose(), reset(), save(), AVATAR_BUCKET (+7 more)

### Community 25 - "Community 25"
Cohesion: 0.24
Nodes (12): AuthorView(), OfferPage(), OfferPageProps, PlayerLink(), PlayerView(), ResultSection(), JoinThread(), MarkMeaningfulAction() (+4 more)

### Community 26 - "Community 26"
Cohesion: 0.21
Nodes (14): reportMessage(), reportOffer(), reportPlayer(), createReport(), CreateReportResult, ErrorsT, emptyToUndefined(), REPORT_COMMENT_MAX (+6 more)

### Community 27 - "Community 27"
Cohesion: 0.15
Nodes (14): ACTION_ACTOR, JoinAction, joinChangeRefusal, nextJoinStatus(), OfferState, TRANSITIONS, playersNeeded(), doubles (+6 more)

### Community 28 - "Community 28"
Cohesion: 0.21
Nodes (16): addDays(), ClubPanelPage(), metadata, AddBlockForm(), AdminActionForm(), blockForSlot(), bookingForSlot(), ClubPanelDay (+8 more)

### Community 29 - "Community 29"
Cohesion: 0.22
Nodes (11): updateProfile(), completeOnboarding(), OnboardingPage(), captureEvent(), AuthRequiredError, requireUser(), profileFieldErrors(), profileToUserData() (+3 more)

### Community 30 - "Community 30"
Cohesion: 0.19
Nodes (13): requestBooking(), RequestBookingResult, daysAhead(), notifyBookingRequested(), formatKrakowTimeRange(), Formatter, krakowHour(), krakowLocalToDate() (+5 more)

### Community 31 - "Community 31"
Cohesion: 0.23
Nodes (14): LanguageSwitcher(), choose(), MESSAGES, setLocale(), AppLocale, DEFAULT_LOCALE, isAppLocale(), LOCALE_COOKIE (+6 more)

### Community 32 - "Community 32"
Cohesion: 0.14
Nodes (16): BOOKING_DURATIONS, BOOKING_FIELDS, BOOKING_MAX_DAYS_AHEAD, BOOKING_NOTE_MAX, BookingDuration, BookingRequestInput, bookingRequestSchema(), BookingRequestValues (+8 more)

### Community 33 - "Community 33"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 34 - "Community 34"
Cohesion: 0.18
Nodes (15): addDays(), BookPage(), BookPageProps, dateOptions(), generateMetadata(), hrefWith(), Params, parseDate() (+7 more)

### Community 35 - "Community 35"
Cohesion: 0.20
Nodes (14): DAILY_OFFER_PUSH_LIMIT, hasDailyCapacity(), interestedCandidates(), isInterestedIn(), isQuietHours(), levelMatches(), NewOfferInfo, NTRP_MATCH_TOLERANCE (+6 more)

### Community 36 - "Community 36"
Cohesion: 0.23
Nodes (6): MemberLayout(), NewOfferPage(), NotificationSettingsPage(), requireOnboardedUser, db, globalForPrisma

### Community 37 - "Community 37"
Cohesion: 0.25
Nodes (10): confirmUnsubscribe(), UnsubscribeResult, UnsubscribePage(), UnsubscribePageProps, UnsubscribeButton(), createUnsubscribeToken(), secret(), sign() (+2 more)

### Community 38 - "Community 38"
Cohesion: 0.17
Nodes (13): EmailTemplateInput, escapeHtml(), renderEmailHtml(), renderEmailText(), appUrl(), BookingRecipient, CATEGORY, claimMessagePushSlot() (+5 more)

### Community 39 - "Community 39"
Cohesion: 0.12
Nodes (16): scripts, build, check:i18n-keys, check:i18n-strings, clubs:load, dev, format, format:check (+8 more)

### Community 40 - "Community 40"
Cohesion: 0.22
Nodes (8): exportMyData(), ExportDataPage(), ExportDataButton(), download(), exportUserData(), UserDataExport, firstNameAndInitial(), {
  userFindUniqueOrThrow,
  offerFindMany,
  joinFindMany,
  messageFindMany,
  matchResultFindMany,
}

### Community 41 - "Community 41"
Cohesion: 0.24
Nodes (9): MobileNav(), NavLink, Sheet(), SheetContent(), SheetOverlay(), SheetPortal(), SheetTitle(), SheetTrigger() (+1 more)

### Community 42 - "Community 42"
Cohesion: 0.29
Nodes (11): OfferCard(), PlayerAvatar(), formatLabel(), LabelT, levelLabel(), placeLabel(), spotsLabel(), avatarUrl() (+3 more)

### Community 43 - "Community 43"
Cohesion: 0.18
Nodes (9): en, testTranslator(), input, { reportCreateManyAndReturn, checkRateLimit, maybeAutoblock }, t, tRateLimit, schema, t (+1 more)

### Community 44 - "Community 44"
Cohesion: 0.28
Nodes (6): signOut(), supabaseEnv(), createSupabaseServerClient(), @supabase/ssr, jar, session

### Community 45 - "Community 45"
Cohesion: 0.27
Nodes (9): ClubPage(), ClubPageProps, generateMetadata(), ExternalLink(), ClubDetails, formatCheckedDate(), Formatter, getClub() (+1 more)

### Community 46 - "Community 46"
Cohesion: 0.21
Nodes (13): Booking (booking schema entity), Club.bookingMode enum (EXTERNAL_LINK / SPINBUDDY), ClubStaff (booking schema entity), Court (booking schema entity), CourtBlock (booking schema entity), CourtHours (booking schema entity), Session 0 — Epic setup, Session 11 — Decision + data model (K.1-K.5) (+5 more)

### Community 47 - "Community 47"
Cohesion: 0.31
Nodes (6): onRequestError, register(), scrubEvent(), nextConfig, withNextIntl, @sentry/nextjs

### Community 48 - "Community 48"
Cohesion: 0.19
Nodes (10): MIN_AGE, PROFILE_FIELDS, ProfileInput, profileSchema(), ProfileValues, SaveProfileResult, ValidationT, errorsFor() (+2 more)

### Community 49 - "Community 49"
Cohesion: 0.21
Nodes (9): notifyInterestedPlayers(), toCandidate(), notify(), createdAt, {
  requireOnboardedUser,
  joinFindUnique,
  messageCreate,
  notify,
  checkRateLimit,
}, upcomingJoin, NOW, OFFER (+1 more)

### Community 50 - "Community 50"
Cohesion: 0.27
Nodes (7): GET(), CallbackParams, otpTypeSchema, parseCallbackParams(), ensureUserRow(), parse(), { upsert }

### Community 51 - "Community 51"
Cohesion: 0.21
Nodes (9): AnalyticsEvent, EventProperties, OfferFormat, OutboundTarget, PropertiesFor, BANNED_PROPERTY_KEYS, getClient(), sanitize() (+1 more)

### Community 52 - "Community 52"
Cohesion: 0.21
Nodes (6): canCancelOffer(), joinRefusal, LATER, NOW, NOW, refusal()

### Community 53 - "Community 53"
Cohesion: 0.21
Nodes (10): getOfferDetails(), OfferDetails, OfferJoinResult, OfferPlayer, playerSelect, resultSelect, toOfferPlayer(), computeReliability() (+2 more)

### Community 54 - "Community 54"
Cohesion: 0.25
Nodes (6): geistMono, geistSans, RootLayout(), viewport, RegisterServiceWorker(), SiteFooter()

### Community 55 - "Community 55"
Cohesion: 0.40
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

### Community 56 - "Community 56"
Cohesion: 0.27
Nodes (8): updateNotificationSetting(), NotificationSettings, NotificationSettingsForm(), toggle(), ROW_KEYS, Switch(), @base-ui/react, cn

### Community 57 - "Community 57"
Cohesion: 0.31
Nodes (7): sendMessage(), getJoinThread(), ThreadMessage, canWriteToThread(), isJoinThreadParticipant(), JOIN, STARTS_AT

### Community 58 - "Community 58"
Cohesion: 0.35
Nodes (9): autoDeclinePendingBookings(), krakowTimeRangeLabel(), ReminderCounts, runNotificationReminders(), sendHowDidItGoPrompts(), sendMatchReminders(), sendResultConfirmationReminders(), NOW (+1 more)

### Community 59 - "Community 59"
Cohesion: 0.29
Nodes (9): AddBlockInput, addBlockSchema(), AddBlockValues, CLUB_PANEL_REASON_MAX, declineReasonSchema(), emptyToUndefined(), localDateTime(), reasonSchema() (+1 more)

### Community 62 - "Community 62"
Cohesion: 0.24
Nodes (7): ActionResult, ErrorText(), FieldErrorLike, GamesRow(), ResultForm(), MatchScoreInput, @hookform/resolvers

### Community 63 - "Community 63"
Cohesion: 0.33
Nodes (6): NTRP_LEVELS, NTRP_MAX, NTRP_MIN, NTRP_STEP, STARTING_ELO, startingElo()

### Community 66 - "Community 66"
Cohesion: 0.22
Nodes (7): { createUnsubscribeToken }, NOW, { recordNotification }, { sendEmail }, { sendPush }, SUB, { userFindUnique, pushSubscriptionDelete, offerJoinUpdateMany }

### Community 67 - "Community 67"
Cohesion: 0.36
Nodes (5): linkClubStaff(), LinkClubStaffResult, main(), usageError(), { userFindUnique, clubFindUnique, clubStaffUpsert }

### Community 68 - "Community 68"
Cohesion: 0.32
Nodes (7): ensureVapidConfigured(), isExpired(), PushPayload, PushSubscriptionKeys, sendPush(), SendPushOutcome, web-push

### Community 69 - "Community 69"
Cohesion: 0.29
Nodes (4): keyPaths(), main(), Messages, en

### Community 70 - "Community 70"
Cohesion: 0.33
Nodes (4): AGENTS.md §1 Project in one paragraph, AGENTS.md §9 Boundaries, EU sui generis database right (Directive 96/9/EC), Court Booking Epic (Slice K) — Session Prompts

### Community 73 - "Community 73"
Cohesion: 0.38
Nodes (5): ActionResult, notificationSettingsSchema, PushSubscriptionInput, pushSubscriptionSchema, zod

### Community 74 - "Community 74"
Cohesion: 0.48
Nodes (5): AUTOBLOCK_THRESHOLD, AUTOBLOCK_WINDOW_DAYS, maybeAutoblock(), shouldAutoblock(), { reportFindMany, userUpdateMany, adminActionCreate }

### Community 76 - "Community 76"
Cohesion: 0.40
Nodes (5): getClient(), sendEmail(), SendEmailInput, SendEmailOutcome, resend

### Community 77 - "Community 77"
Cohesion: 0.53
Nodes (3): eloDistance(), RankableOffer, rankByEloCloseness()

### Community 78 - "Community 78"
Cohesion: 0.50
Nodes (3): AGENTS.md §8 Git workflow, booking-epic integration branch workflow, Session 16 — Partner integration (separate epic)

### Community 82 - "Community 82"
Cohesion: 0.67
Nodes (3): lint-staged, *.{json,css,yaml,yml}, *.{ts,tsx,mts,js,mjs}

## Knowledge Gaps
- **43 isolated node(s):** `AGENTS.md §10 How this file grows`, `Spin Buddy (Brand)`, `Spin Buddy Logo`, `Generic File Icon Asset`, `Globe Icon` (+38 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 587 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **64 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next-intl` connect `Community 5` to `Community 1`, `Community 2`, `Community 3`, `Community 4`, `Community 6`, `Community 7`, `Community 10`, `Community 11`, `Community 12`, `Community 13`, `Community 14`, `Community 16`, `Community 17`, `Community 21`, `Community 23`, `Community 24`, `Community 25`, `Community 26`, `Community 28`, `Community 29`, `Community 30`, `Community 31`, `Community 34`, `Community 36`, `Community 37`, `Community 38`, `Community 40`, `Community 41`, `Community 42`, `Community 43`, `Community 45`, `Community 47`, `Community 54`, `Community 56`, `Community 61`, `Community 62`, `Community 69`, `Community 73`?**
  _High betweenness centrality (0.190) - this node is a cross-community bridge._
- **What connects `AGENTS.md §10 How this file grows`, `Spin Buddy (Brand)`, `Spin Buddy Logo` to the rest of the system?**
  _43 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.07404426559356136 - nodes in this community are weakly interconnected._
- **Why does `vitest` connect `Community 1` to `Community 2`, `Community 3`, `Community 4`, `Community 8`, `Community 10`, `Community 11`, `Community 12`, `Community 13`, `Community 14`, `Community 15`, `Community 16`, `Community 17`, `Community 21`, `Community 22`, `Community 23`, `Community 24`, `Community 25`, `Community 26`, `Community 27`, `Community 28`, `Community 29`, `Community 30`, `Community 32`, `Community 34`, `Community 35`, `Community 36`, `Community 37`, `Community 40`, `Community 42`, `Community 43`, `Community 44`, `Community 45`, `Community 47`, `Community 48`, `Community 49`, `Community 50`, `Community 51`, `Community 52`, `Community 53`, `Community 55`, `Community 57`, `Community 58`, `Community 59`, `Community 63`, `Community 66`, `Community 67`, `Community 69`, `Community 74`, `Community 77`, `Community 80`?**
  _High betweenness centrality (0.140) - this node is a cross-community bridge._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.05924978687127025 - nodes in this community are weakly interconnected._
- **Why does `next` connect `Community 61` to `Community 1`, `Community 2`, `Community 3`, `Community 4`, `Community 5`, `Community 7`, `Community 10`, `Community 11`, `Community 12`, `Community 13`, `Community 14`, `Community 16`, `Community 17`, `Community 21`, `Community 23`, `Community 24`, `Community 25`, `Community 28`, `Community 29`, `Community 30`, `Community 31`, `Community 34`, `Community 36`, `Community 37`, `Community 40`, `Community 41`, `Community 42`, `Community 44`, `Community 45`, `Community 47`, `Community 50`, `Community 54`, `Community 55`, `Community 73`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.07441016333938294 - nodes in this community are weakly interconnected._