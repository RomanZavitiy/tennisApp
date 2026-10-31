# Graph Report - tennisApp  (2026-10-31)

## Corpus Check
- 26 files · ~181,549 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1725 nodes · 4355 edges · 138 communities (77 shown, 61 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 76 edges (avg confidence: 0.84)
- Token cost: 173,023 input · 0 output

## Community Hubs (Navigation)
- Admin Actions & Moderation
- supabase-admin.ts
- lib_generated_prisma_enums
- compilerOptions
- availability.ts
- package.json
- result-actions.ts
- next-intl
- PLANNING.md (v2)
- club.ts
- Account Deletion & Data Export
- login-form.tsx
- report-actions.ts
- devDependencies
- offer-form.tsx
- Club Submission Rate Limiting
- @sentry/nextjs
- offers/[id]/actions.ts
- join-rules.ts
- zod
- require-user.ts
- dependencies
- scripts
- next-intl
- club-list.tsx
- notify.test.ts
- next-intl
- language-switcher.tsx
- app/offers/actions.test.ts
- club.ts
- unsubscribe/page.tsx
- avatar-upload.tsx
- export-user-data.ts
- AGENTS.md §2 Stack
- result-actions.ts
- book/actions.ts
- AGENTS.md §2 Stack
- next-intl
- Leaderboard Page & Filters
- profile-form.tsx
- new/actions.ts
- captureEvent
- book/page.tsx
- Session 11 — Decision + data model (K.1-K.5)
- profile-form.tsx
- booking.ts
- profile.ts
- club-list.tsx
- createSupabaseServerClient
- notify
- delete/actions.ts
- ELO rating system
- App Shell & Navigation
- reliability.ts
- result-form.tsx
- Court booking v1: request-based booking for SpinBuddy-owned availability at partner clubs, no payments, no sync with external booking systems (Slice K)
- New PushSubscription table, notification-preference columns on User, and a new users.email mirror column synced by ensureUserRow on every login (tasks 5.3, 5.15, 5.16)
- Offer/chat model: author is not a join row; players-needed computed from format+hasPartner, not stored; two thread kinds (private per-join, group per doubles offer) with no separate thread table (task 3.1)
- admin/actions.ts
- Leaderboard Data & Reliability
- [clubId]/page.tsx
- messages table: one row per message, exactly one of offer_join_id/offer_id set, SELECT policy via a SECURITY DEFINER function in a private (non-API) schema — the first policy that opens public reads for authenticated (task 3.15)
- supabase-admin.ts
- options.ts
- vercel.json
- AGENTS.md §2 Stack
- admin/actions.ts
- Club Submission Form
- components.json
- result-actions.ts
- admin/actions.ts
- AGENTS.md §8 Git workflow
- offer-interest.ts
- notify.ts
- Base DB schema: snake_case naming, UUID ids, enum statuses, cascade/restrict delete rules (task 0.12)
- avatar_path stores a bucket path (not full URL); each upload gets a random filename; saveAvatar() verifies path+existence before deleting the old file (task 1.14a)
- ESLint strictTypeChecked + no-console ban except warn/error (task 0.8)
- /terms and /privacy are public draft placeholder pages with a banner and a dated CURRENT_CONSENT_VERSION; onboarding adds a consent checkbox; existing users are re-gated to /consent when the version changes (tasks 6.11, 6.12)
- AGENTS.md §7 Testing instructions
- engines
- next.config.ts sets agentRules:false (task 0.4)
- Prettier default settings, markdown excluded, LF via .gitattributes (task 0.7)
- proxy.ts (middleware) allows only an explicit PUBLIC_ROUTES allowlist, everything else redirects to /login (task 1.4)
- Players without a completed profile are redirected to /onboarding via the app/(member)/ route group layout calling requireOnboardedUser() (task 1.12b)
- Maskable App Icon (512px)
- CI workflow (ci.yml)
- engines
- UI language: English only, no i18n yet
- language-switcher.tsx
- Cron: daily Vercel Cron Job for auto-confirmation now; hourly reminders will reuse the same /api/cron via a GitHub Actions schedule workflow, not Supabase pg_cron/pg_net (task 5.8)
- Minimum registration age 16 (superseded 2026-10-14)
- language-switcher.tsx
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
- Minimum registration age 16 (superseded 2026-10-14)
- language-switcher.tsx

## God Nodes (most connected - your core abstractions)
1. `vitest` - 101 edges
2. `next-intl` - 100 edges
3. `next` - 85 edges
4. `db` - 54 edges
5. `Button()` - 47 edges
6. `react` - 45 edges
7. `requireOnboardedUser` - 38 edges
8. `zod` - 34 edges
9. `buttonVariants` - 31 edges
10. `createAdminClient()` - 25 edges

## Surprising Connections (you probably didn't know these)
- `Hide/unhide an offer (Slice N)` --references--> `OfferCard()`  [EXTRACTED]
  docs/TIER1-FEATURES.md → components/offer-card.tsx
- `Hide/unhide an offer (Slice N)` --references--> `feedWhere()`  [EXTRACTED]
  docs/TIER1-FEATURES.md → lib/offers/feed-filters.ts
- `OfferDismissal Prisma model` --shares_data_with--> `feedWhere()`  [EXTRACTED]
  docs/TIER1-FEATURES.md → lib/offers/feed-filters.ts
- `dismissOffer(offerId) action` --references--> `requireOnboardedUser`  [EXTRACTED]
  docs/TIER1-FEATURES.md → lib/auth/require-onboarded-user.ts
- `approveSubmission()` --conceptually_related_to--> `New NotificationKind value (submitter decision notice)`  [EXTRACTED]
  app/admin/club-submissions/actions.ts → docs/TIER1-FEATURES.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Club submission admin review flow** — app_admin_club_submissions_page_clubsubmissionspage, app_admin_club_submissions_actions_approvesubmission, app_admin_club_submissions_actions_rejectsubmission, lib_auth_require_admin_requireadmin [EXTRACTED 1.00]
- **Hide/unhide offer flow** — lib_offers_dismissals_actions_dismissoffer, components_offer_card_offercard, app_offers_hidden_page_hiddenofferspage, lib_offers_feed_filters_feedwhere [EXTRACTED 1.00]
- **Slice-Based Session Workflow** — docs_planning, docs_prompts_00_readme, docs_prompts_01_session_audit_and_offer, docs_prompts_02_session_join_flow, docs_prompts_03_session_chat, docs_prompts_04_session_results_and_elo, docs_prompts_05_session_reliability, docs_prompts_06_session_courts_and_booking, docs_prompts_07_session_pwa_and_notifications, docs_prompts_08_session_safety_and_admin, docs_prompts_09_session_polish_and_profile_photo, docs_prompts_10_session_launch_readiness [EXTRACTED 1.00]
- **Three Tier-1 slices sharing a common session preamble** — docs_tier1_features_leaderboard_v1, docs_tier1_features_club_submission_feature, docs_tier1_features_hide_undo_offer, docs_tier1_features_shared_preamble [EXTRACTED 1.00]
- **Sparring Offer Lifecycle Feature** — agents_decisions_offer_chat_model, agents_decisions_offer_fields_schema, agents_decisions_offer_zod_schema_krakow_time, agents_decisions_create_offer_action, agents_decisions_offer_new_form, agents_decisions_offers_feed_page, agents_decisions_offers_feed_filters, agents_decisions_offer_join_schema_reuse, agents_decisions_request_to_join_action, agents_decisions_join_transitions, agents_decisions_offer_details_page, agents_decisions_cancel_offer_action [INFERRED 0.85]
- **Club Discovery Feature (Map and List)** — agents_decisions_club_fields_schema, agents_decisions_clubs_loader_tsx_upsert, agents_decisions_club_map_leaflet, agents_decisions_club_markers_db_fetch, agents_decisions_clubs_page_list_map_toggle, agents_decisions_club_schema_real_data, agents_decisions_clubs_list_map_sync, agents_decisions_club_details_page, agents_decisions_club_map_fit_bounds [INFERRED 0.85]
- **Authentication and Onboarding Flow** — agents_decisions_auth_magic_link_google_oauth, agents_decisions_auth_flow_e2e_login, agents_decisions_login_page_forms, agents_decisions_sign_out_local_scope, agents_decisions_user_row_callback_creation, agents_decisions_player_profile_fields, agents_decisions_onboarding_redirect_layout [INFERRED 0.85]
- **ELO Rating System** — agents_decisions_elo_singles_only, agents_decisions_starting_elo_ntrp, agents_decisions_elo_matches_played_user_fields, agents_decisions_elo_closeness_ranking, agents_decisions_feed_ranking_integration, agents_decisions_elo_formula, agents_decisions_match_result_model [INFERRED 0.85]
- **Notifications System (Push, Email, In-App)** — agents_decisions_notifications_web_push_primary, agents_decisions_notifications_schema_users_email, agents_decisions_notification_quiet_hours_throttle, agents_decisions_email_fallback_sandbox_sender, agents_decisions_unsubscribe_confirm_click, agents_decisions_cron_reminders_job, agents_decisions_in_app_notifications_table [INFERRED 0.85]
- **Safety and Moderation System** — agents_decisions_auto_block_reports, agents_decisions_reports_admin_schema, agents_decisions_rate_limiting_postgres, agents_decisions_rate_limit_fixed_window [INFERRED 0.85]
- **Match Results and Player Reliability** — agents_decisions_match_score_format, agents_decisions_match_result_confirmation, agents_decisions_match_result_model, agents_decisions_no_show_handling, agents_decisions_player_reliability, agents_decisions_reliability_counters_user_fields [INFERRED 0.85]
- **Club Submissions Feature** — agents_decisions_club_submissions_table_rls, agents_decisions_club_submissions_admin_queue_no_notify, agents_decisions_clubs_loader_tsx_upsert [INFERRED 0.85]
- **Development Infrastructure and Tooling Setup** — agents_decisions_tech_stack, agents_decisions_nextjs_node_prisma_versions, agents_decisions_node_pnpm_pinning, agents_decisions_prettier_defaults_lf, agents_decisions_eslint_strict_type_checked, agents_decisions_husky_lint_staged, agents_decisions_ci_github_actions, agents_decisions_playwright_e2e_setup, agents_decisions_vitest_setup [INFERRED 0.85]
- **RLS and Data Access Security Model** — agents_decisions_rls_deny_by_default, agents_decisions_rls_prisma_strategy, agents_decisions_rls_e2e_verification, agents_decisions_avatars_bucket_policies, agents_decisions_messages_model_rls_policy, agents_decisions_club_submissions_table_rls [INFERRED 0.85]

## Communities (138 total, 61 thin omitted)

### Community 0 - "Admin Actions & Moderation"
Cohesion: 0.05
Nodes (59): AdminActionResult, annulDisputedResult(), blockFromReport(), confirmDisputedResult(), dismissReport(), hideReport(), logAction(), unblockPlayer() (+51 more)

### Community 1 - "supabase-admin.ts"
Cohesion: 0.06
Nodes (52): saveAvatar(), Card(), ProfilePage(), SettingsLink(), generateMetadata(), PlayerPage(), PlayerPageProps, ACCEPT (+44 more)

### Community 2 - "lib_generated_prisma_enums"
Cohesion: 0.07
Nodes (35): admin, PNG, admin, created, PNG, signedInClient(), far, near (+27 more)

### Community 3 - "compilerOptions"
Cohesion: 0.06
Nodes (38): confirmUnsubscribe(), UnsubscribeResult, UnsubscribePage(), UnsubscribePageProps, UnsubscribeButton(), getClient(), sendEmail(), SendEmailInput (+30 more)

### Community 4 - "availability.ts"
Cohesion: 0.10
Nodes (36): ActionResult, notificationSettingsSchema, removePushSubscription(), savePushSubscription(), updateNotificationSetting(), NotificationSettingsPage(), NotificationSettings, NotificationSettingsForm() (+28 more)

### Community 5 - "package.json"
Cohesion: 0.08
Nodes (33): Home(), ClubList(), ClubListEntry(), ClubListItem, ClubMap(), ClubMapMarker, ClubMapProps, FIT_PADDING (+25 more)

### Community 6 - "result-actions.ts"
Cohesion: 0.09
Nodes (29): reportMessage(), reportOffer(), reportPlayer(), getJoinThread(), ThreadMessage, canWriteToThread(), isJoinThreadParticipant(), AUTOBLOCK_THRESHOLD (+21 more)

### Community 7 - "next-intl"
Cohesion: 0.10
Nodes (26): OffersPage(), eloDistance(), RankableOffer, rankByEloCloseness(), FEED_PAGE_SIZE, FeedOffer, feedOfferSelect, FeedPage (+18 more)

### Community 8 - "PLANNING.md (v2)"
Cohesion: 0.09
Nodes (23): upsertClubs(), ClubRecord, clubSchema, CourtHoursRecord, courtHoursRecordSchema, CourtRecord, courtRecordSchema, describe() (+15 more)

### Community 9 - "club.ts"
Cohesion: 0.20
Nodes (19): ErrorPage(), EditProfilePage(), AddBlockResult, ClubFiltersForm(), FieldErrorLike, LoginForm(), OfferFilters(), aria() (+11 more)

### Community 10 - "Account Deletion & Data Export"
Cohesion: 0.13
Nodes (15): AccountDeletedPage(), DeleteAccountPage(), AdminAction, AdminActionResult, MessageRow, ThreadMessage, ReportActionResult, ReportButton() (+7 more)

### Community 11 - "login-form.tsx"
Cohesion: 0.14
Nodes (28): MEMORY.md (agent working notes), AGENTS.md — SpinBuddy Agent Rules, Claude Code Planning Prompt, PLANNING-v1.md (archived), Launch Checklist — MatchFinder Kraków, PLANNING.md (v2), Slice A — Sync and Process Lightening, Slice B — Finish the Offer (+20 more)

### Community 12 - "report-actions.ts"
Cohesion: 0.08
Nodes (26): eslintConfig, engines, node, name, packageManager, private, version, class-variance-authority (+18 more)

### Community 13 - "devDependencies"
Cohesion: 0.15
Nodes (18): markNotificationsReadAction(), offerIdSchema, unreadNotificationCount(), NotificationsPage(), MarkNotificationsRead(), NotificationBell(), NOTIFICATIONS_CHANGED_EVENT, getCurrentUser() (+10 more)

### Community 14 - "offer-form.tsx"
Cohesion: 0.12
Nodes (22): BLOCKING_BOOKING_STATUSES, BlockingBookingStatus, BookingInput, buildDayGrid(), BuildDayGridInput, buildDayWindows(), canFit(), CourtBlockInput (+14 more)

### Community 15 - "Club Submission Rate Limiting"
Cohesion: 0.11
Nodes (20): submitClub(), blockedRefusal() check, createOffer (reference usage of blockedRefusal), checkRateLimit(), RATE_LIMITS, RateLimitResult, ADDRESS_MAX, CLUB_SUBMISSION_FIELDS (+12 more)

### Community 16 - "@sentry/nextjs"
Cohesion: 0.14
Nodes (15): recordOutboundClick(), BookingLink(), track(), AnalyticsEvent, EventProperties, OfferFormat, OutboundTarget, PropertiesFor (+7 more)

### Community 17 - "offers/[id]/actions.ts"
Cohesion: 0.18
Nodes (16): OfferPage(), OfferPageProps, PlayerView(), JoinThread(), AuthorView(), OfferBookingSection(), PlayerLink(), ResultSection() (+8 more)

### Community 18 - "join-rules.ts"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 19 - "zod"
Cohesion: 0.09
Nodes (22): dependencies, @base-ui/react, class-variance-authority, cn, @hookform/resolvers, leaflet, lucide-react, next (+14 more)

### Community 20 - "require-user.ts"
Cohesion: 0.09
Nodes (22): devDependencies, eslint, eslint-config-next, eslint-config-prettier, husky, lint-staged, @playwright/test, prettier (+14 more)

### Community 21 - "dependencies"
Cohesion: 0.16
Nodes (16): acceptJoin(), cancelOffer(), changeJoin(), declineJoin(), JoinChangeResult, requestToJoin(), RequestToJoinResult, SendMessageResult (+8 more)

### Community 22 - "scripts"
Cohesion: 0.14
Nodes (16): BOOKING_DURATIONS, BOOKING_FIELDS, BOOKING_MAX_DAYS_AHEAD, BOOKING_NOTE_MAX, BookingDuration, BookingRequestInput, bookingRequestSchema(), BookingRequestValues (+8 more)

### Community 23 - "next-intl"
Cohesion: 0.20
Nodes (12): HeaderNavLinks(), isActive(), NavLink, MyGames(), OfferCard(), formatLabel(), LabelT, levelLabel() (+4 more)

### Community 24 - "club-list.tsx"
Cohesion: 0.21
Nodes (13): MESSAGES, isPublicRoute(), PUBLIC_ROUTES, setLocale(), AppLocale, DEFAULT_LOCALE, isAppLocale(), LOCALE_COOKIE (+5 more)

### Community 25 - "notify.test.ts"
Cohesion: 0.19
Nodes (16): DAILY_OFFER_PUSH_LIMIT, hasDailyCapacity(), interestedCandidates(), isInterestedIn(), isQuietHours(), levelMatches(), NewOfferInfo, NTRP_MATCH_TOLERANCE (+8 more)

### Community 26 - "next-intl"
Cohesion: 0.16
Nodes (16): DEFAULT_OFFER_DURATION, isOfferDuration(), OfferDuration, offerEndsAt(), COMMENT_MAX, CreateOfferResult, emptyToUndefined(), OFFER_FIELDS (+8 more)

### Community 27 - "language-switcher.tsx"
Cohesion: 0.20
Nodes (19): AGENTS.md §2 Stack, GitHub Actions (CI), Next.js, OpenStreetMap, Playwright, pnpm, PostHog EU, Prisma ORM (+11 more)

### Community 28 - "app/offers/actions.test.ts"
Cohesion: 0.18
Nodes (11): sendMagicLink(), SendMagicLinkResult, onSubmit(), supabaseEnv(), updateSession(), createSupabaseServerClient(), @supabase/ssr, { headersGet, signInWithOtp, checkRateLimit } (+3 more)

### Community 29 - "club.ts"
Cohesion: 0.16
Nodes (12): aria(), ClubOption, ErrorText(), Field(), FieldErrorLike, NtrpSelect(), OfferForm(), OFFER_DURATIONS (+4 more)

### Community 30 - "unsubscribe/page.tsx"
Cohesion: 0.17
Nodes (15): ACTION_ACTOR, JoinAction, joinChangeRefusal, nextJoinStatus(), OfferState, offerStatusFor(), TRANSITIONS, playersNeeded() (+7 more)

### Community 31 - "avatar-upload.tsx"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 32 - "export-user-data.ts"
Cohesion: 0.21
Nodes (12): addBlock(), ClubPanelActionResult, confirmBooking(), declineBooking(), overlapsABooking(), removeBlock(), isExclusionViolation(), bookingDurationMinutes() (+4 more)

### Community 33 - "AGENTS.md §2 Stack"
Cohesion: 0.14
Nodes (14): RESULT_CONFIRMED_MESSAGE, RESULT_DISPUTED_MESSAGE, RESULT_NO_SHOW_REPORTED_MESSAGE, RESULT_SUBMITTED_MESSAGE, ThreadRef, isSystemMessageKey(), SYSTEM_MESSAGE_KEYS, SystemMessageKey (+6 more)

### Community 34 - "result-actions.ts"
Cohesion: 0.16
Nodes (8): vitest, en, testTranslator(), schema, schema, t, schema, en

### Community 35 - "book/actions.ts"
Cohesion: 0.18
Nodes (10): GET(), LoginPage(), LoginPageProps, CallbackParams, otpTypeSchema, parseCallbackParams(), ensureUserRow(), safeNextPath() (+2 more)

### Community 36 - "AGENTS.md §2 Stack"
Cohesion: 0.25
Nodes (13): MemberLayout(), confirmResult(), disputeResult(), ErrorsT, loadSubmittableJoin(), PendingResult, SettleAction, SettleOutcome (+5 more)

### Community 37 - "next-intl"
Cohesion: 0.20
Nodes (12): NewOfferPage(), BookingGroup(), MyBookings(), STATUS_STYLE, daysAhead(), MyBooking, formatKrakowTimeRange(), Formatter (+4 more)

### Community 38 - "Leaderboard Page & Filters"
Cohesion: 0.17
Nodes (13): LeaderboardPage(), LeaderboardFiltersForm(), LeaderboardRow(), PlayerLink-style pattern, fields, first(), LeaderboardFilters, leaderboardHref() (+5 more)

### Community 39 - "profile-form.tsx"
Cohesion: 0.24
Nodes (9): SaveAvatarResult, updateProfile(), completeOnboarding(), OnboardingPage(), STARTING_ELO, startingElo(), profileFieldErrors(), profileToUserData() (+1 more)

### Community 40 - "new/actions.ts"
Cohesion: 0.19
Nodes (5): CURRENT_CONSENT_VERSION, needsConsent(), { update, redirect }, complete, { findUnique, redirect }

### Community 41 - "captureEvent"
Cohesion: 0.15
Nodes (10): BOOKING_CANCEL_WINDOW_HOURS, BookingRow, bookingSelect, getMyBookings(), toMyBooking(), JUST_INSIDE_WINDOW, NOW, WELL_AHEAD (+2 more)

### Community 42 - "book/page.tsx"
Cohesion: 0.18
Nodes (8): linkClubStaff(), LinkClubStaffResult, db, globalForPrisma, @prisma/adapter-pg, main(), usageError(), { userFindUnique, clubFindUnique, clubStaffUpsert }

### Community 43 - "Session 11 — Decision + data model (K.1-K.5)"
Cohesion: 0.12
Nodes (16): scripts, build, check:i18n-keys, check:i18n-strings, clubs:load, dev, format, format:check (+8 more)

### Community 44 - "profile-form.tsx"
Cohesion: 0.20
Nodes (12): ageOn(), MIN_AGE, PROFILE_FIELDS, ProfileInput, profileSchema(), ProfileValues, SaveProfileResult, todayInKrakow() (+4 more)

### Community 45 - "booking.ts"
Cohesion: 0.23
Nodes (11): cancelBooking(), requestBooking(), RequestBookingResult, canCancelBooking(), notifyBookingCancelled(), notifyBookingRequested(), sendBookingNotification(), PENDING_BOOKING (+3 more)

### Community 46 - "profile.ts"
Cohesion: 0.26
Nodes (7): giveConsent(), ConsentPage(), AuthRequiredError, requireUser(), { requireUser, update, redirect, captureEvent }, valid, getClaims

### Community 47 - "club-list.tsx"
Cohesion: 0.21
Nodes (9): geistMono, geistSans, RootLayout(), viewport, LanguageSwitcher(), choose(), RegisterServiceWorker(), SiteFooter() (+1 more)

### Community 48 - "createSupabaseServerClient"
Cohesion: 0.25
Nodes (8): createOffer(), blockedRefusal(), activeOffersWhere(), MAX_ACTIVE_OFFERS, offerFieldErrors(), {
  requireOnboardedUser,
  clubFindUnique,
  offerCount,
  offerCreate,
  redirect,
  notifyInterestedPlayers,
  checkRateLimit,
}, valid, t

### Community 49 - "notify"
Cohesion: 0.24
Nodes (11): BookingGrid(), Formatter, LEGEND_SWATCH, overlapsRange(), T, timeLabel(), SlotStatus, runs() (+3 more)

### Community 50 - "delete/actions.ts"
Cohesion: 0.25
Nodes (8): MobileNav(), NavLink, Sheet(), SheetContent(), SheetOverlay(), SheetPortal(), SheetTitle(), SheetTrigger()

### Community 51 - "ELO rating system"
Cohesion: 0.25
Nodes (7): applyMatchElo(), applyMatchEloFromJoin(), PendingResultJoin, computeEloChange(), expectedScore(), kFactor(), MatchOutcome

### Community 54 - "reliability.ts"
Cohesion: 0.27
Nodes (9): ClubPage(), ClubPageProps, generateMetadata(), ExternalLink(), ClubDetails, formatCheckedDate(), Formatter, getClub() (+1 more)

### Community 55 - "result-form.tsx"
Cohesion: 0.21
Nodes (13): Booking (booking schema entity), Club.bookingMode enum (EXTERNAL_LINK / SPINBUDDY), ClubStaff (booking schema entity), Court (booking schema entity), CourtBlock (booking schema entity), CourtHours (booking schema entity), Session 0 — Epic setup, Session 11 — Decision + data model (K.1-K.5) (+5 more)

### Community 56 - "Court booking v1: request-based booking for SpinBuddy-owned availability at partner clubs, no payments, no sync with external booking systems (Slice K)"
Cohesion: 0.31
Nodes (6): onRequestError, register(), scrubEvent(), nextConfig, withNextIntl, @sentry/nextjs

### Community 57 - "New PushSubscription table, notification-preference columns on User, and a new users.email mirror column synced by ensureUserRow on every login (tasks 5.3, 5.15, 5.16)"
Cohesion: 0.26
Nodes (7): GET(), RESULT_AUTO_CONFIRMED_MESSAGE, autoConfirmExpiredResults(), { autoConfirmExpiredResults, runNotificationReminders }, { matchResultFindMany, postSystemMessage, tx }, pendingNoShowReport, pendingResult

### Community 58 - "Offer/chat model: author is not a join row; players-needed computed from format+hasPartner, not stored; two thread kinds (private per-join, group per doubles offer) with no separate thread table (task 3.1)"
Cohesion: 0.27
Nodes (10): addDays(), BookPage(), BookPageProps, dateOptions(), hrefWith(), Params, parseDate(), parseDuration() (+2 more)

### Community 59 - "admin/actions.ts"
Cohesion: 0.21
Nodes (11): Hidden offers view / Unhide, Club submission feature (Slice M), Hide/unhide an offer (Slice N), Owner checklist before starting, requestToJoin skipDuplicates idiom, Shared session preamble, dismissOffer(offerId) action, prisma/load-clubs.ts (clubs:load pipeline) (+3 more)

### Community 60 - "Leaderboard Data & Reliability"
Cohesion: 0.21
Nodes (9): NTRP_MIN/MAX/STEP constants, getLeaderboard(), LEADERBOARD_SIZE, LeaderboardPlayer, LeaderboardRow, leaderboardSelect, toLeaderboardPlayer(), Reliability (+1 more)

### Community 61 - "[clubId]/page.tsx"
Cohesion: 0.21
Nodes (6): canCancelOffer(), joinRefusal, LATER, NOW, NOW, refusal()

### Community 62 - "messages table: one row per message, exactly one of offer_join_id/offer_id set, SELECT policy via a SECURITY DEFINER function in a private (non-API) schema — the first policy that opens public reads for authenticated (task 3.15)"
Cohesion: 0.36
Nodes (10): notify(), autoDeclinePendingBookings(), krakowTimeRangeLabel(), ReminderCounts, runNotificationReminders(), sendHowDidItGoPrompts(), sendMatchReminders(), sendResultConfirmationReminders() (+2 more)

### Community 63 - "supabase-admin.ts"
Cohesion: 0.24
Nodes (11): gamesSchema(), isValidRegularSet(), isValidSet(), isValidSuperTiebreak(), MatchScoreInput, matchScoreSchema(), MatchScoreValues, SetOutcome (+3 more)

### Community 65 - "options.ts"
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

### Community 66 - "vercel.json"
Cohesion: 0.31
Nodes (5): markCourtBooked(), MarkMeaningfulAction(), OfferActionButton(), hasMeaningfulAction(), markMeaningfulAction()

### Community 67 - "AGENTS.md §2 Stack"
Cohesion: 0.24
Nodes (7): partyOf(), settleResultRefusal, submitResultRefusal, FUTURE, join, NOW, PAST

### Community 70 - "admin/actions.ts"
Cohesion: 0.20
Nodes (10): .agents/decisions.md decisions log, AGENTS.md (single source of truth), CLAUDE.md project instructions, docs/BOOKING-EPIC.md (Slice K), Tier-1 feature prompts doc, pnpm check:i18n-keys / check:i18n-strings, graph.json graph data file, graphify-out/GRAPH_REPORT.md (+2 more)

### Community 71 - "Club Submission Form"
Cohesion: 0.24
Nodes (7): SuggestClubPage(), aria(), ClubSubmissionForm(), ErrorText(), Field(), OfferForm shape pattern, ProfileForm shape pattern

### Community 72 - "components.json"
Cohesion: 0.24
Nodes (7): ActionResult, ErrorText(), FieldErrorLike, GamesRow(), ResultForm(), @hookform/resolvers, react-hook-form

### Community 73 - "result-actions.ts"
Cohesion: 0.29
Nodes (9): AddBlockInput, addBlockSchema(), AddBlockValues, CLUB_PANEL_REASON_MAX, declineReasonSchema(), emptyToUndefined(), localDateTime(), reasonSchema() (+1 more)

### Community 75 - "admin/actions.ts"
Cohesion: 0.22
Nodes (7): leaderboard-filters client form, ClubFiltersForm pattern, HeaderNavLinks() component (nav entry), Leaderboard v1 (Slice L), MobileNav() component (nav entry), OfferFilters pattern, leaderboardQuerySchema (Zod)

### Community 76 - "AGENTS.md §8 Git workflow"
Cohesion: 0.22
Nodes (7): { createUnsubscribeToken }, NOW, { recordNotification }, { sendEmail }, { sendPush }, SUB, { userFindUnique, pushSubscriptionDelete, offerJoinUpdateMany }

### Community 78 - "offer-interest.ts"
Cohesion: 0.32
Nodes (7): sendMessage(), MessageThread(), addMessage(), submit(), createdAt, {
  requireOnboardedUser,
  joinFindUnique,
  messageCreate,
  notify,
  checkRateLimit,
}, upcomingJoin

### Community 79 - "notify.ts"
Cohesion: 0.39
Nodes (6): loginSchema(), LoginValues, magicLinkRequestSchema(), ValidationT, emailError(), t

### Community 81 - "Base DB schema: snake_case naming, UUID ids, enum statuses, cascade/restrict delete rules (task 0.12)"
Cohesion: 0.47
Nodes (4): exportMyData(), ExportDataPage(), ExportDataButton(), download()

### Community 83 - "avatar_path stores a bucket path (not full URL); each upload gets a random filename; saveAvatar() verifies path+existence before deleting the old file (task 1.14a)"
Cohesion: 0.40
Nodes (3): NOW, OFFER, { userFindMany, userUpdate, notify }

### Community 90 - "ESLint strictTypeChecked + no-console ban except warn/error (task 0.8)"
Cohesion: 0.67
Nodes (3): AGENTS.md §8 Git workflow, booking-epic integration branch workflow, Session 16 — Partner integration (separate epic)

### Community 91 - "/terms and /privacy are public draft placeholder pages with a banner and a dated CURRENT_CONSENT_VERSION; onboarding adds a consent checkbox; existing users are re-gated to /consent when the version changes (tasks 6.11, 6.12)"
Cohesion: 0.67
Nodes (3): lint-staged, *.{json,css,yaml,yml}, *.{ts,tsx,mts,js,mjs}

## Ambiguous Edges - Review These
- `Sparring Offer and Chat Thread Model` → `Feed Ranking by ELO Closeness`  [AMBIGUOUS]
  .agents/decisions.md · relation: conceptually_related_to

## Knowledge Gaps
- **73 isolated node(s):** `husky`, `lint-staged`, `prettier`, `@prisma/client`, `react-dom` (+68 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 638 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **61 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `result-actions.ts` to `Admin Actions & Moderation`, `supabase-admin.ts`, `compilerOptions`, `availability.ts`, `package.json`, `result-actions.ts`, `next-intl`, `PLANNING.md (v2)`, `report-actions.ts`, `devDependencies`, `offer-form.tsx`, `Club Submission Rate Limiting`, `@sentry/nextjs`, `offers/[id]/actions.ts`, `dependencies`, `scripts`, `next-intl`, `club-list.tsx`, `notify.test.ts`, `next-intl`, `app/offers/actions.test.ts`, `club.ts`, `unsubscribe/page.tsx`, `export-user-data.ts`, `AGENTS.md §2 Stack`, `book/actions.ts`, `next-intl`, `profile-form.tsx`, `new/actions.ts`, `captureEvent`, `book/page.tsx`, `profile-form.tsx`, `booking.ts`, `profile.ts`, `createSupabaseServerClient`, `notify`, `ELO rating system`, `reliability.ts`, `Court booking v1: request-based booking for SpinBuddy-owned availability at partner clubs, no payments, no sync with external booking systems (Slice K)`, `New PushSubscription table, notification-preference columns on User, and a new users.email mirror column synced by ensureUserRow on every login (tasks 5.3, 5.15, 5.16)`, `Leaderboard Data & Reliability`, `[clubId]/page.tsx`, `messages table: one row per message, exactly one of offer_join_id/offer_id set, SELECT policy via a SECURITY DEFINER function in a private (non-API) schema — the first policy that opens public reads for authenticated (task 3.15)`, `options.ts`, `vercel.json`, `AGENTS.md §2 Stack`, `AGENTS.md §8 Git workflow`, `offer-interest.ts`, `notify.ts`, `avatar_path stores a bucket path (not full URL); each upload gets a random filename; saveAvatar() verifies path+existence before deleting the old file (task 1.14a)`?**
  _High betweenness centrality (0.188) - this node is a cross-community bridge._
- **What connects `husky`, `lint-staged`, `prettier` to the rest of the system?**
  _73 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Admin Actions & Moderation` be split into smaller, more focused modules?**
  _Cohesion score 0.05058717253839205 - nodes in this community are weakly interconnected._
- **Why does `next-intl` connect `Account Deletion & Data Export` to `Admin Actions & Moderation`, `supabase-admin.ts`, `compilerOptions`, `availability.ts`, `package.json`, `result-actions.ts`, `next-intl`, `club.ts`, `report-actions.ts`, `devDependencies`, `Club Submission Rate Limiting`, `offers/[id]/actions.ts`, `dependencies`, `scripts`, `next-intl`, `club-list.tsx`, `language-switcher.tsx`, `app/offers/actions.test.ts`, `club.ts`, `export-user-data.ts`, `result-actions.ts`, `book/actions.ts`, `AGENTS.md §2 Stack`, `next-intl`, `Leaderboard Page & Filters`, `profile-form.tsx`, `new/actions.ts`, `booking.ts`, `profile.ts`, `club-list.tsx`, `createSupabaseServerClient`, `notify`, `delete/actions.ts`, `App Shell & Navigation`, `reliability.ts`, `Court booking v1: request-based booking for SpinBuddy-owned availability at partner clubs, no payments, no sync with external booking systems (Slice K)`, `Offer/chat model: author is not a join row; players-needed computed from format+hasPartner, not stored; two thread kinds (private per-join, group per doubles offer) with no separate thread table (task 3.1)`, `vercel.json`, `Club Submission Form`, `components.json`, `Base DB schema: snake_case naming, UUID ids, enum statuses, cascade/restrict delete rules (task 0.12)`?**
  _High betweenness centrality (0.129) - this node is a cross-community bridge._
- **Should `supabase-admin.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05898021308980213 - nodes in this community are weakly interconnected._
- **Why does `next` connect `App Shell & Navigation` to `Admin Actions & Moderation`, `supabase-admin.ts`, `compilerOptions`, `availability.ts`, `package.json`, `next-intl`, `club.ts`, `Account Deletion & Data Export`, `report-actions.ts`, `devDependencies`, `offers/[id]/actions.ts`, `dependencies`, `next-intl`, `club-list.tsx`, `app/offers/actions.test.ts`, `export-user-data.ts`, `book/actions.ts`, `AGENTS.md §2 Stack`, `next-intl`, `Leaderboard Page & Filters`, `profile-form.tsx`, `new/actions.ts`, `booking.ts`, `profile.ts`, `club-list.tsx`, `createSupabaseServerClient`, `notify`, `delete/actions.ts`, `reliability.ts`, `Court booking v1: request-based booking for SpinBuddy-owned availability at partner clubs, no payments, no sync with external booking systems (Slice K)`, `New PushSubscription table, notification-preference columns on User, and a new users.email mirror column synced by ensureUserRow on every login (tasks 5.3, 5.15, 5.16)`, `Offer/chat model: author is not a join row; players-needed computed from format+hasPartner, not stored; two thread kinds (private per-join, group per doubles offer) with no separate thread table (task 3.1)`, `options.ts`, `vercel.json`, `Club Submission Form`, `Base DB schema: snake_case naming, UUID ids, enum statuses, cascade/restrict delete rules (task 0.12)`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `Sparring Offer and Chat Thread Model` and `Feed Ranking by ELO Closeness`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._