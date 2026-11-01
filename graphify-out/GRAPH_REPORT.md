# Graph Report - tennisApp  (2026-10-31)

## Corpus Check
- 12 files · ~185,165 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1789 nodes · 4430 edges · 151 communities (88 shown, 63 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 76 edges (avg confidence: 0.84)
- Token cost: 76,514 input · 0 output

## Community Hubs (Navigation)
- AGENTS.md §2 Stack
- lib_generated_prisma_enums
- next-intl
- compilerOptions
- Admin Actions & Moderation
- club.ts
- PLANNING.md (v2)
- package.json
- admin/actions.ts
- profile-form.tsx
- report-actions.ts
- login-form.tsx
- new/actions.ts
- Leaderboard Page & Filters
- availability.ts
- Club Submission Rate Limiting
- notify.test.ts
- Account Deletion & Data Export
- @sentry/nextjs
- offers/[id]/actions.ts
- result-actions.ts
- join-rules.ts
- zod
- require-user.ts
- supabase-admin.ts
- app/offers/actions.test.ts
- Account Deletion & Data Export
- result-actions.ts
- scripts
- supabase-admin.ts
- delete/actions.ts
- language-switcher.tsx
- dependencies
- unsubscribe/page.tsx
- avatar-upload.tsx
- devDependencies
- book/page.tsx
- supabase-admin.ts
- package.json
- club-list.tsx
- Admin Actions & Moderation
- book/actions.ts
- offer-form.tsx
- captureEvent
- export-user-data.ts
- Session 11 — Decision + data model (K.1-K.5)
- notify
- next-intl
- createSupabaseServerClient
- profile.ts
- next-intl
- result-actions.ts
- result-form.tsx
- Court booking v1: request-based booking for SpinBuddy-owned availability at partner clubs, no payments, no sync with external booking systems (Slice K)
- ELO rating system
- messages table: one row per message, exactly one of offer_join_id/offer_id set, SELECT policy via a SECURITY DEFINER function in a private (non-API) schema — the first policy that opens public reads for authenticated (task 3.15)
- Offer/chat model: author is not a join row; players-needed computed from format+hasPartner, not stored; two thread kinds (private per-join, group per doubles offer) with no separate thread table (task 3.1)
- club-list.tsx
- supabase-admin.ts
- options.ts
- Club Submission Form
- next-intl
- offer-form.tsx
- result-actions.ts
- availability.ts
- vercel.json
- Club Follow Server Actions
- ClubFollow Schema & Thread Participant Check
- AGENTS.md §8 Git workflow
- components.json
- Club Chat Decisions & Slice O Sessions
- next-intl
- notify.ts
- devDependencies
- admin/actions.ts
- Coach Data Model & Load Pipeline
- Coaching Directory Page Components
- result-actions.ts
- New PushSubscription table, notification-preference columns on User, and a new users.email mirror column synced by ensureUserRow on every login (tasks 5.3, 5.15, 5.16)
- Coach Directory Decisions & Sessions
- Admin Actions & Moderation
- [clubId]/page.tsx
- [clubId]/page.tsx
- app/offers/actions.test.ts
- Message Model Club Chat Extension
- offer-interest.ts
- ESLint strictTypeChecked + no-console ban except warn/error (task 0.8)
- Tier-2 Features Doc Overview
- Club Chat Message Reporting
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
1. `vitest` - 102 edges
2. `next-intl` - 101 edges
3. `next` - 86 edges
4. `db` - 55 edges
5. `Button()` - 48 edges
6. `react` - 46 edges
7. `requireOnboardedUser` - 39 edges
8. `zod` - 35 edges
9. `buttonVariants` - 30 edges
10. `createAdminClient()` - 25 edges

## Surprising Connections (you probably didn't know these)
- `approveSubmission()` --conceptually_related_to--> `New NotificationKind value (submitter decision notice)`  [EXTRACTED]
  app/admin/club-submissions/actions.ts → docs/TIER1-FEATURES.md
- `Club submission feature (Slice M)` --references--> `approveSubmission()`  [EXTRACTED]
  docs/TIER1-FEATURES.md → app/admin/club-submissions/actions.ts
- `Club submission feature (Slice M)` --references--> `rejectSubmission()`  [EXTRACTED]
  docs/TIER1-FEATURES.md → app/admin/club-submissions/actions.ts
- `submitClub()` --references--> `blockedRefusal() check`  [EXTRACTED]
  app/clubs/suggest/actions.ts → docs/TIER1-FEATURES.md
- `Club submission feature (Slice M)` --references--> `submitClub()`  [EXTRACTED]
  docs/TIER1-FEATURES.md → app/clubs/suggest/actions.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Club submission admin review flow** — app_admin_club_submissions_page_clubsubmissionspage, app_admin_club_submissions_actions_approvesubmission, app_admin_club_submissions_actions_rejectsubmission, lib_auth_require_admin_requireadmin [EXTRACTED 1.00]
- **Hide/unhide offer flow** — lib_offers_dismissals_actions_dismissoffer, components_offer_card_offercard, app_offers_hidden_page_hiddenofferspage, lib_offers_feed_filters_feedwhere [EXTRACTED 1.00]
- **Slice-Based Session Workflow** — docs_planning, docs_prompts_00_readme, docs_prompts_01_session_audit_and_offer, docs_prompts_02_session_join_flow, docs_prompts_03_session_chat, docs_prompts_04_session_results_and_elo, docs_prompts_05_session_reliability, docs_prompts_06_session_courts_and_booking, docs_prompts_07_session_pwa_and_notifications, docs_prompts_08_session_safety_and_admin, docs_prompts_09_session_polish_and_profile_photo, docs_prompts_10_session_launch_readiness [EXTRACTED 1.00]
- **Three Tier-1 slices sharing a common session preamble** — docs_tier1_features_leaderboard_v1, docs_tier1_features_club_submission_feature, docs_tier1_features_hide_undo_offer, docs_tier1_features_shared_preamble [EXTRACTED 1.00]
- **Authentication and Onboarding Flow** — agents_decisions_auth_magic_link_google_oauth, agents_decisions_auth_flow_e2e_login, agents_decisions_login_page_forms, agents_decisions_sign_out_local_scope, agents_decisions_user_row_callback_creation, agents_decisions_player_profile_fields, agents_decisions_onboarding_redirect_layout [INFERRED 0.85]
- **Club Discovery Feature (Map and List)** — agents_decisions_club_fields_schema, agents_decisions_clubs_loader_tsx_upsert, agents_decisions_club_map_leaflet, agents_decisions_club_markers_db_fetch, agents_decisions_clubs_page_list_map_toggle, agents_decisions_club_schema_real_data, agents_decisions_clubs_list_map_sync, agents_decisions_club_details_page, agents_decisions_club_map_fit_bounds [INFERRED 0.85]
- **Club Submissions Feature** — agents_decisions_club_submissions_table_rls, agents_decisions_club_submissions_admin_queue_no_notify, agents_decisions_clubs_loader_tsx_upsert [INFERRED 0.85]
- **Development Infrastructure and Tooling Setup** — agents_decisions_tech_stack, agents_decisions_nextjs_node_prisma_versions, agents_decisions_node_pnpm_pinning, agents_decisions_prettier_defaults_lf, agents_decisions_eslint_strict_type_checked, agents_decisions_husky_lint_staged, agents_decisions_ci_github_actions, agents_decisions_playwright_e2e_setup, agents_decisions_vitest_setup [INFERRED 0.85]
- **ELO Rating System** — agents_decisions_elo_singles_only, agents_decisions_starting_elo_ntrp, agents_decisions_elo_matches_played_user_fields, agents_decisions_elo_closeness_ranking, agents_decisions_feed_ranking_integration, agents_decisions_elo_formula, agents_decisions_match_result_model [INFERRED 0.85]
- **Match Results and Player Reliability** — agents_decisions_match_score_format, agents_decisions_match_result_confirmation, agents_decisions_match_result_model, agents_decisions_no_show_handling, agents_decisions_player_reliability, agents_decisions_reliability_counters_user_fields [INFERRED 0.85]
- **Notifications System (Push, Email, In-App)** — agents_decisions_notifications_web_push_primary, agents_decisions_notifications_schema_users_email, agents_decisions_notification_quiet_hours_throttle, agents_decisions_email_fallback_sandbox_sender, agents_decisions_unsubscribe_confirm_click, agents_decisions_cron_reminders_job, agents_decisions_in_app_notifications_table [INFERRED 0.85]
- **Sparring Offer Lifecycle Feature** — agents_decisions_offer_chat_model, agents_decisions_offer_fields_schema, agents_decisions_offer_zod_schema_krakow_time, agents_decisions_create_offer_action, agents_decisions_offer_new_form, agents_decisions_offers_feed_page, agents_decisions_offers_feed_filters, agents_decisions_offer_join_schema_reuse, agents_decisions_request_to_join_action, agents_decisions_join_transitions, agents_decisions_offer_details_page, agents_decisions_cancel_offer_action [INFERRED 0.85]
- **RLS and Data Access Security Model** — agents_decisions_rls_deny_by_default, agents_decisions_rls_prisma_strategy, agents_decisions_rls_e2e_verification, agents_decisions_avatars_bucket_policies, agents_decisions_messages_model_rls_policy, agents_decisions_club_submissions_table_rls [INFERRED 0.85]
- **Safety and Moderation System** — agents_decisions_auto_block_reports, agents_decisions_reports_admin_schema, agents_decisions_rate_limiting_postgres, agents_decisions_rate_limit_fixed_window [INFERRED 0.85]
- **Club Chat RLS / CHECK Schema Change** — docs_tier2_features_messages_one_thread_check, docs_tier2_features_is_message_thread_participant_fn, docs_tier2_features_messages_thread_participants_read_policy, docs_tier2_features_message_clubid_field, docs_tier2_features_session_o2 [EXTRACTED 1.00]
- **Coach Data Model + Load Pipeline** — docs_tier2_features_coach_model, docs_tier2_features_coach_validation_fn, docs_tier2_features_upsert_coaches_fn, docs_tier2_features_coaches_json_data, docs_tier2_features_session_p1 [EXTRACTED 1.00]
- **Club Follow Flow** — docs_tier2_features_clubfollow_model, docs_tier2_features_followclub_fn, docs_tier2_features_unfollowclub_fn, docs_tier2_features_follow_club_button_component, docs_tier2_features_session_o1 [EXTRACTED 1.00]

## Communities (151 total, 63 thin omitted)

### Community 0 - "AGENTS.md §2 Stack"
Cohesion: 0.05
Nodes (54): MemberLayout(), exportMyData(), ExportDataPage(), confirmResult(), disputeResult(), ErrorsT, loadSubmittableJoin(), PendingResult (+46 more)

### Community 1 - "lib_generated_prisma_enums"
Cohesion: 0.07
Nodes (35): admin, PNG, admin, created, PNG, signedInClient(), far, near (+27 more)

### Community 2 - "next-intl"
Cohesion: 0.06
Nodes (45): recordOutboundClick(), ClubPage(), ClubPageProps, generateMetadata(), OffersPage(), BookingLink(), track(), ExternalLink() (+37 more)

### Community 3 - "compilerOptions"
Cohesion: 0.05
Nodes (45): requestBooking(), confirmUnsubscribe(), UnsubscribeResult, UnsubscribePage(), UnsubscribePageProps, UnsubscribeButton(), getClient(), sendEmail() (+37 more)

### Community 4 - "Admin Actions & Moderation"
Cohesion: 0.07
Nodes (41): AdminActionResult, annulDisputedResult(), blockFromReport(), confirmDisputedResult(), dismissReport(), hideReport(), logAction(), unblockPlayer() (+33 more)

### Community 5 - "club.ts"
Cohesion: 0.14
Nodes (28): AddBlockResult, FieldErrorLike, LoginForm(), OfferFilters(), aria(), ClubOption, ErrorText(), Field() (+20 more)

### Community 6 - "PLANNING.md (v2)"
Cohesion: 0.09
Nodes (23): upsertClubs(), ClubRecord, clubSchema, CourtHoursRecord, courtHoursRecordSchema, CourtRecord, courtRecordSchema, describe() (+15 more)

### Community 7 - "package.json"
Cohesion: 0.14
Nodes (20): Home(), ClubFiltersForm(), ClubList(), ClubListEntry(), ClubListItem, ClubMapMarker, ClubMapProps, ClubMap() (+12 more)

### Community 8 - "admin/actions.ts"
Cohesion: 0.09
Nodes (26): .agents/decisions.md decisions log, AGENTS.md (single source of truth), Hidden offers view / Unhide, CLAUDE.md project instructions, leaderboard-filters client form, docs/BOOKING-EPIC.md (Slice K), Club submission feature (Slice M), ClubFiltersForm pattern (+18 more)

### Community 9 - "profile-form.tsx"
Cohesion: 0.12
Nodes (20): SaveAvatarResult, updateProfile(), EditProfilePage(), STARTING_ELO, startingElo(), ageOn(), MIN_AGE, PROFILE_FIELDS (+12 more)

### Community 10 - "report-actions.ts"
Cohesion: 0.08
Nodes (27): eslintConfig, engines, node, name, packageManager, private, version, class-variance-authority (+19 more)

### Community 11 - "login-form.tsx"
Cohesion: 0.14
Nodes (28): MEMORY.md (agent working notes), AGENTS.md — SpinBuddy Agent Rules, Claude Code Planning Prompt, PLANNING-v1.md (archived), Launch Checklist — MatchFinder Kraków, PLANNING.md (v2), Slice A — Sync and Process Lightening, Slice B — Finish the Offer (+20 more)

### Community 12 - "new/actions.ts"
Cohesion: 0.12
Nodes (8): giveConsent(), ConsentPage(), CURRENT_CONSENT_VERSION, needsConsent(), next, { update, redirect }, complete, { findUnique, redirect }

### Community 13 - "Leaderboard Page & Filters"
Cohesion: 0.11
Nodes (22): LeaderboardPage(), LeaderboardFiltersForm(), LeaderboardRow(), NTRP_MIN/MAX/STEP constants, PlayerLink-style pattern, Coaches Query Zod Schema, getLeaderboard(), LEADERBOARD_SIZE (+14 more)

### Community 14 - "availability.ts"
Cohesion: 0.18
Nodes (24): removePushSubscription(), savePushSubscription(), initialStatus(), PushSubscribeControl(), disable(), enable(), Status, dismiss() (+16 more)

### Community 15 - "Club Submission Rate Limiting"
Cohesion: 0.11
Nodes (20): submitClub(), blockedRefusal() check, createOffer (reference usage of blockedRefusal), checkRateLimit(), RATE_LIMITS, RateLimitResult, ADDRESS_MAX, CLUB_SUBMISSION_FIELDS (+12 more)

### Community 16 - "notify.test.ts"
Cohesion: 0.14
Nodes (19): DAILY_OFFER_PUSH_LIMIT, hasDailyCapacity(), interestedCandidates(), isInterestedIn(), isQuietHours(), levelMatches(), NewOfferInfo, NTRP_MATCH_TOLERANCE (+11 more)

### Community 17 - "Account Deletion & Data Export"
Cohesion: 0.20
Nodes (11): AccountDeletedPage(), ErrorPage(), DeleteAccountPage(), HeaderNavLinks(), isActive(), NavLink, NotificationBell(), Button() (+3 more)

### Community 18 - "@sentry/nextjs"
Cohesion: 0.13
Nodes (16): RequestBookingResult, ActionResult, notificationSettingsSchema, AnalyticsEvent, EventProperties, OfferFormat, OutboundTarget, PropertiesFor (+8 more)

### Community 19 - "offers/[id]/actions.ts"
Cohesion: 0.16
Nodes (15): OfferPage(), OfferPageProps, PlayerView(), AuthorView(), OfferBookingSection(), PlayerLink(), ResultSection(), getOfferDetails() (+7 more)

### Community 20 - "result-actions.ts"
Cohesion: 0.13
Nodes (12): vitest, en, testTranslator(), input, { reportCreateManyAndReturn, checkRateLimit, maybeAutoblock }, t, tRateLimit, schema (+4 more)

### Community 21 - "join-rules.ts"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 22 - "zod"
Cohesion: 0.09
Nodes (22): dependencies, @base-ui/react, class-variance-authority, cn, @hookform/resolvers, leaflet, lucide-react, next (+14 more)

### Community 23 - "require-user.ts"
Cohesion: 0.09
Nodes (22): devDependencies, eslint, eslint-config-next, eslint-config-prettier, husky, lint-staged, @playwright/test, prettier (+14 more)

### Community 24 - "supabase-admin.ts"
Cohesion: 0.20
Nodes (14): generateMetadata(), PlayerPage(), PlayerPageProps, MatchHistory(), eloChangeLabel(), formatScore(), formatScoreFor(), getMatchHistory() (+6 more)

### Community 25 - "app/offers/actions.test.ts"
Cohesion: 0.16
Nodes (12): signOut(), GET(), sendMagicLink(), SendMagicLinkResult, onSubmit(), ensureUserRow(), createSupabaseServerClient(), { headersGet, signInWithOtp, checkRateLimit } (+4 more)

### Community 26 - "Account Deletion & Data Export"
Cohesion: 0.19
Nodes (14): sendMessage(), AdminAction, AdminActionResult, MessageRow, MessageThread(), addMessage(), submit(), ThreadMessage (+6 more)

### Community 27 - "result-actions.ts"
Cohesion: 0.21
Nodes (14): reportMessage(), reportOffer(), reportPlayer(), createReport(), CreateReportResult, ErrorsT, emptyToUndefined(), REPORT_COMMENT_MAX (+6 more)

### Community 28 - "scripts"
Cohesion: 0.14
Nodes (16): BOOKING_DURATIONS, BOOKING_FIELDS, BOOKING_MAX_DAYS_AHEAD, BOOKING_NOTE_MAX, BookingDuration, BookingRequestInput, bookingRequestSchema(), BookingRequestValues (+8 more)

### Community 29 - "supabase-admin.ts"
Cohesion: 0.19
Nodes (12): PlayerAvatar(), ProfileHero(), PublicProfile, computeReliability(), isLateCancellation(), recordLateCancellation(), recordScheduledMatch(), Reliability (+4 more)

### Community 30 - "delete/actions.ts"
Cohesion: 0.16
Nodes (12): MobileNav(), NavLink, NotificationSettings, ROW_KEYS, Sheet(), SheetContent(), SheetOverlay(), SheetPortal() (+4 more)

### Community 31 - "language-switcher.tsx"
Cohesion: 0.20
Nodes (19): AGENTS.md §2 Stack, GitHub Actions (CI), Next.js, OpenStreetMap, Playwright, pnpm, PostHog EU, Prisma ORM (+11 more)

### Community 32 - "dependencies"
Cohesion: 0.16
Nodes (15): acceptJoin(), cancelOffer(), changeJoin(), declineJoin(), JoinChangeResult, markCourtBooked(), requestToJoin(), RequestToJoinResult (+7 more)

### Community 33 - "unsubscribe/page.tsx"
Cohesion: 0.17
Nodes (15): ACTION_ACTOR, JoinAction, joinChangeRefusal, nextJoinStatus(), OfferState, offerStatusFor(), TRANSITIONS, playersNeeded() (+7 more)

### Community 34 - "avatar-upload.tsx"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 35 - "devDependencies"
Cohesion: 0.21
Nodes (13): markNotificationsReadAction(), offerIdSchema, unreadNotificationCount(), getCurrentUser(), countUnreadNotifications(), InboxNotification, markNotificationsRead(), NOTIFICATIONS_SHOWN (+5 more)

### Community 36 - "book/page.tsx"
Cohesion: 0.17
Nodes (7): linkClubStaff(), LinkClubStaffResult, db, globalForPrisma, main(), usageError(), { userFindUnique, clubFindUnique, clubStaffUpsert }

### Community 37 - "supabase-admin.ts"
Cohesion: 0.25
Nodes (15): saveAvatar(), ACCEPT, AvatarUpload(), choose(), reset(), save(), AVATAR_BUCKET, AVATAR_MAX_BYTES (+7 more)

### Community 38 - "package.json"
Cohesion: 0.19
Nodes (14): ClubMap(), FIT_PADDING, FitToContainer(), KRAKOW_CENTER, ShowClubPickedInList(), markerIconDefault, ClubSelection, ClubSelectionContext (+6 more)

### Community 39 - "club-list.tsx"
Cohesion: 0.22
Nodes (14): LanguageSwitcher(), choose(), MESSAGES, setLocale(), AppLocale, DEFAULT_LOCALE, isAppLocale(), LOCALE_COOKIE (+6 more)

### Community 40 - "Admin Actions & Moderation"
Cohesion: 0.24
Nodes (14): addDays(), ClubPanelPage(), metadata, AddBlockForm(), blockForSlot(), bookingForSlot(), ClubPanelDay, getClubPanelDay() (+6 more)

### Community 41 - "book/actions.ts"
Cohesion: 0.18
Nodes (11): LoginPage(), LoginPageProps, GoogleSignInButton(), signIn(), CallbackParams, otpTypeSchema, parseCallbackParams(), isPublicRoute() (+3 more)

### Community 42 - "offer-form.tsx"
Cohesion: 0.18
Nodes (14): BLOCKING_BOOKING_STATUSES, BlockingBookingStatus, BookingInput, buildDayGrid(), BuildDayGridInput, buildDayWindows(), canFit(), CourtBlockInput (+6 more)

### Community 43 - "captureEvent"
Cohesion: 0.16
Nodes (11): BOOKING_CANCEL_WINDOW_HOURS, canCancelBooking(), BookingRow, bookingSelect, getMyBookings(), toMyBooking(), JUST_INSIDE_WINDOW, NOW (+3 more)

### Community 44 - "export-user-data.ts"
Cohesion: 0.22
Nodes (11): addBlock(), ClubPanelActionResult, confirmBooking(), declineBooking(), overlapsABooking(), removeBlock(), isExclusionViolation(), bookingDurationMinutes() (+3 more)

### Community 45 - "Session 11 — Decision + data model (K.1-K.5)"
Cohesion: 0.12
Nodes (16): scripts, build, check:i18n-keys, check:i18n-strings, clubs:load, dev, format, format:check (+8 more)

### Community 46 - "notify"
Cohesion: 0.23
Nodes (12): BookingGrid(), Formatter, LEGEND_SWATCH, overlapsRange(), T, timeLabel(), DaySlot, SlotStatus (+4 more)

### Community 47 - "next-intl"
Cohesion: 0.23
Nodes (8): cancelBooking(), Card(), ProfilePage(), SettingsLink(), BookingGroup(), MyBookings(), STATUS_STYLE, MyBooking

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

### Community 49 - "profile.ts"
Cohesion: 0.29
Nodes (7): completeOnboarding(), OnboardingPage(), AuthRequiredError, requireUser(), { requireUser, update, redirect, captureEvent }, valid, getClaims

### Community 50 - "next-intl"
Cohesion: 0.21
Nodes (12): COMMENT_MAX, CreateOfferResult, emptyToUndefined(), OFFER_FIELDS, OfferInput, offerSchema(), OfferValues, ValidationT (+4 more)

### Community 52 - "result-actions.ts"
Cohesion: 0.26
Nodes (8): JoinThread(), MessageThread Component (generalized), getJoinThread(), ThreadMessage, canWriteToThread(), isJoinThreadParticipant(), JOIN, STARTS_AT

### Community 53 - "result-form.tsx"
Cohesion: 0.21
Nodes (13): Booking (booking schema entity), Club.bookingMode enum (EXTERNAL_LINK / SPINBUDDY), ClubStaff (booking schema entity), Court (booking schema entity), CourtBlock (booking schema entity), CourtHours (booking schema entity), Session 0 — Epic setup, Session 11 — Decision + data model (K.1-K.5) (+5 more)

### Community 54 - "Court booking v1: request-based booking for SpinBuddy-owned availability at partner clubs, no payments, no sync with external booking systems (Slice K)"
Cohesion: 0.31
Nodes (6): onRequestError, register(), scrubEvent(), nextConfig, withNextIntl, @sentry/nextjs

### Community 55 - "ELO rating system"
Cohesion: 0.26
Nodes (6): applyMatchElo(), PendingResultJoin, computeEloChange(), expectedScore(), kFactor(), MatchOutcome

### Community 56 - "messages table: one row per message, exactly one of offer_join_id/offer_id set, SELECT policy via a SECURITY DEFINER function in a private (non-API) schema — the first policy that opens public reads for authenticated (task 3.15)"
Cohesion: 0.35
Nodes (11): notify(), notifyBookingDecided(), autoDeclinePendingBookings(), krakowTimeRangeLabel(), ReminderCounts, runNotificationReminders(), sendHowDidItGoPrompts(), sendMatchReminders() (+3 more)

### Community 57 - "Offer/chat model: author is not a join row; players-needed computed from format+hasPartner, not stored; two thread kinds (private per-join, group per doubles offer) with no separate thread table (task 3.1)"
Cohesion: 0.27
Nodes (10): addDays(), BookPage(), BookPageProps, dateOptions(), hrefWith(), Params, parseDate(), parseDuration() (+2 more)

### Community 58 - "club-list.tsx"
Cohesion: 0.24
Nodes (7): geistMono, geistSans, RootLayout(), viewport, RegisterServiceWorker(), SiteFooter(), SiteHeader()

### Community 59 - "supabase-admin.ts"
Cohesion: 0.21
Nodes (9): MyGames(), getMyUpcomingGames(), MyGame, MyGameRole, offerSelect, placeLabel(), NOW, offer() (+1 more)

### Community 61 - "options.ts"
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

### Community 64 - "Club Submission Form"
Cohesion: 0.24
Nodes (7): SuggestClubPage(), aria(), ClubSubmissionForm(), ErrorText(), Field(), OfferForm shape pattern, ProfileForm shape pattern

### Community 65 - "next-intl"
Cohesion: 0.36
Nodes (8): NewOfferPage(), daysAhead(), formatKrakowTimeRange(), Formatter, krakowHour(), krakowLocalToDate(), krakowParts, toKrakowLocal()

### Community 66 - "offer-form.tsx"
Cohesion: 0.24
Nodes (8): CourtDayGrid, BLOCKING_BOOKING_STATUSES, dayBounds(), DayGrid, DayGridCourt, getDayGrid(), CLUB_ROW, { findFirst, findBookings, findBlocks }

### Community 67 - "result-actions.ts"
Cohesion: 0.29
Nodes (9): AddBlockInput, addBlockSchema(), AddBlockValues, CLUB_PANEL_REASON_MAX, declineReasonSchema(), emptyToUndefined(), localDateTime(), reasonSchema() (+1 more)

### Community 69 - "availability.ts"
Cohesion: 0.28
Nodes (6): updateNotificationSetting(), NotificationSettingsPage(), NotificationSettingsForm(), toggle(), { pushUpsert, pushFindUnique, pushDeleteMany, userUpdate, captureEvent }, subscription

### Community 70 - "vercel.json"
Cohesion: 0.39
Nodes (4): MarkMeaningfulAction(), OfferActionButton(), hasMeaningfulAction(), markMeaningfulAction()

### Community 71 - "Club Follow Server Actions"
Cohesion: 0.25
Nodes (8): blockedRefusal(), FollowClubButton Component, followClub(), requestToJoin() skipDuplicates Idiom (N.4), requireOnboardedUser(), sendClubMessage(), sendMessage() (app/offers/[id]/actions.ts), unfollowClub()

### Community 72 - "ClubFollow Schema & Thread Participant Check"
Cohesion: 0.22
Nodes (9): ClubFollow Model, export-user-data.ts (GDPR export), firstNameAndInitial() (lib/privacy/opponent-name.ts), getClub() (lib/clubs/club-details.ts), getClubThread(), is_message_thread_participant() SECURITY DEFINER Function, "messages: thread participants can read" RLS Policy, offer_dismissals RLS-No-Policy Pattern (+1 more)

### Community 73 - "AGENTS.md §8 Git workflow"
Cohesion: 0.22
Nodes (7): { createUnsubscribeToken }, NOW, { recordNotification }, { sendEmail }, { sendPush }, SUB, { userFindUnique, pushSubscriptionDelete, offerJoinUpdateMany }

### Community 75 - "components.json"
Cohesion: 0.32
Nodes (5): ActionResult, ErrorText(), FieldErrorLike, GamesRow(), ResultForm()

### Community 76 - "Club Chat Decisions & Slice O Sessions"
Cohesion: 0.36
Nodes (6): Club Chat Feature, .agents/decisions.md, notify() Function, Session O1: Follow a Club, Session O2: Club Chat (Message.clubId + RLS), Slice O

### Community 77 - "next-intl"
Cohesion: 0.36
Nodes (6): formatLabel(), LabelT, levelLabel(), spotsLabel(), format, t

### Community 78 - "notify.ts"
Cohesion: 0.39
Nodes (6): loginSchema(), LoginValues, magicLinkRequestSchema(), ValidationT, emailError(), t

### Community 79 - "devDependencies"
Cohesion: 0.43
Nodes (4): NotificationsPage(), MarkNotificationsRead(), NOTIFICATIONS_CHANGED_EVENT, listNotifications()

### Community 80 - "admin/actions.ts"
Cohesion: 0.38
Nodes (5): requestToJoin skipDuplicates idiom, dismissOffer(), DismissOfferResult, undismissOffer(), {
  requireOnboardedUser,
  offerFindUnique,
  dismissalCreateMany,
  dismissalDeleteMany,
  revalidatePath,
}

### Community 81 - "Coach Data Model & Load Pipeline"
Cohesion: 0.29
Nodes (7): Club Model, Coach Model, Coach Zod Schema (lib/validation/coach.ts), prisma/data/coaches.json, CoachLevel Enum, upsertCoaches(), upsert-clubs.ts / load-clubs.ts

### Community 82 - "Coaching Directory Page Components"
Cohesion: 0.29
Nodes (7): ClubFiltersForm Component, CoachCard Component, CoachFilters Component, app/coaches/page.tsx, ExternalLink Component, getCoaches(), leaderboard-filters Component

### Community 83 - "result-actions.ts"
Cohesion: 0.48
Nodes (5): AUTOBLOCK_THRESHOLD, AUTOBLOCK_WINDOW_DAYS, maybeAutoblock(), shouldAutoblock(), { reportFindMany, userUpdateMany, adminActionCreate }

### Community 85 - "New PushSubscription table, notification-preference columns on User, and a new users.email mirror column synced by ensureUserRow on every login (tasks 5.3, 5.15, 5.16)"
Cohesion: 0.53
Nodes (3): GET(), autoConfirmExpiredResults(), { autoConfirmExpiredResults, runNotificationReminders }

### Community 86 - "Coach Directory Decisions & Sessions"
Cohesion: 0.47
Nodes (4): Coaching Directory Feature, Session P1: Coach Data Model + Load Pipeline, Session P2: Coaching Directory Page, Slice P

### Community 87 - "Admin Actions & Moderation"
Cohesion: 0.40
Nodes (4): ClubStaffSession, requireClubStaff, SessionUser, { getCurrentUser, findUnique, notFound }

### Community 88 - "[clubId]/page.tsx"
Cohesion: 0.47
Nodes (3): joinRefusal, NOW, refusal()

### Community 89 - "[clubId]/page.tsx"
Cohesion: 0.40
Nodes (3): canCancelOffer(), LATER, NOW

### Community 92 - "Message Model Club Chat Extension"
Cohesion: 0.50
Nodes (3): Message.clubId Field, Message Model, messages_one_thread_check Constraint

### Community 93 - "offer-interest.ts"
Cohesion: 0.50
Nodes (3): createdAt, {
  requireOnboardedUser,
  joinFindUnique,
  messageCreate,
  notify,
  checkRateLimit,
}, upcomingJoin

### Community 100 - "ESLint strictTypeChecked + no-console ban except warn/error (task 0.8)"
Cohesion: 0.67
Nodes (3): AGENTS.md §8 Git workflow, booking-epic integration branch workflow, Session 16 — Partner integration (separate epic)

### Community 103 - "Club Chat Message Reporting"
Cohesion: 0.67
Nodes (3): app/admin/reports Page, reportClubMessage(), reportMessage() (app/offers/[id]/report-actions.ts)

### Community 104 - "/terms and /privacy are public draft placeholder pages with a banner and a dated CURRENT_CONSENT_VERSION; onboarding adds a consent checkbox; existing users are re-gated to /consent when the version changes (tasks 6.11, 6.12)"
Cohesion: 0.67
Nodes (3): lint-staged, *.{json,css,yaml,yml}, *.{ts,tsx,mts,js,mjs}

## Ambiguous Edges - Review These
- `Feed Ranking by ELO Closeness` → `Sparring Offer and Chat Thread Model`  [AMBIGUOUS]
  .agents/decisions.md · relation: conceptually_related_to

## Knowledge Gaps
- **97 isolated node(s):** `husky`, `lint-staged`, `prettier`, `@prisma/client`, `react-dom` (+92 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 668 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **63 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `result-actions.ts` to `AGENTS.md §2 Stack`, `next-intl`, `compilerOptions`, `Admin Actions & Moderation`, `club.ts`, `PLANNING.md (v2)`, `package.json`, `profile-form.tsx`, `report-actions.ts`, `new/actions.ts`, `Leaderboard Page & Filters`, `availability.ts`, `Club Submission Rate Limiting`, `notify.test.ts`, `@sentry/nextjs`, `offers/[id]/actions.ts`, `supabase-admin.ts`, `app/offers/actions.test.ts`, `result-actions.ts`, `scripts`, `supabase-admin.ts`, `dependencies`, `unsubscribe/page.tsx`, `devDependencies`, `book/page.tsx`, `supabase-admin.ts`, `Admin Actions & Moderation`, `book/actions.ts`, `offer-form.tsx`, `captureEvent`, `export-user-data.ts`, `notify`, `next-intl`, `createSupabaseServerClient`, `profile.ts`, `next-intl`, `result-actions.ts`, `Court booking v1: request-based booking for SpinBuddy-owned availability at partner clubs, no payments, no sync with external booking systems (Slice K)`, `ELO rating system`, `messages table: one row per message, exactly one of offer_join_id/offer_id set, SELECT policy via a SECURITY DEFINER function in a private (non-API) schema — the first policy that opens public reads for authenticated (task 3.15)`, `supabase-admin.ts`, `options.ts`, `next-intl`, `offer-form.tsx`, `availability.ts`, `vercel.json`, `AGENTS.md §8 Git workflow`, `next-intl`, `notify.ts`, `admin/actions.ts`, `result-actions.ts`, `New PushSubscription table, notification-preference columns on User, and a new users.email mirror column synced by ensureUserRow on every login (tasks 5.3, 5.15, 5.16)`, `Admin Actions & Moderation`, `[clubId]/page.tsx`, `[clubId]/page.tsx`, `app/offers/actions.test.ts`, `offer-interest.ts`?**
  _High betweenness centrality (0.143) - this node is a cross-community bridge._
- **What connects `husky`, `lint-staged`, `prettier` to the rest of the system?**
  _97 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `AGENTS.md §2 Stack` be split into smaller, more focused modules?**
  _Cohesion score 0.05432595573440644 - nodes in this community are weakly interconnected._
- **Why does `next-intl` connect `Account Deletion & Data Export` to `AGENTS.md §2 Stack`, `next-intl`, `compilerOptions`, `Admin Actions & Moderation`, `club.ts`, `package.json`, `profile-form.tsx`, `report-actions.ts`, `new/actions.ts`, `Leaderboard Page & Filters`, `availability.ts`, `Club Submission Rate Limiting`, `@sentry/nextjs`, `offers/[id]/actions.ts`, `result-actions.ts`, `supabase-admin.ts`, `app/offers/actions.test.ts`, `Account Deletion & Data Export`, `result-actions.ts`, `scripts`, `supabase-admin.ts`, `delete/actions.ts`, `language-switcher.tsx`, `dependencies`, `book/page.tsx`, `supabase-admin.ts`, `package.json`, `club-list.tsx`, `Admin Actions & Moderation`, `book/actions.ts`, `export-user-data.ts`, `notify`, `next-intl`, `createSupabaseServerClient`, `profile.ts`, `result-actions.ts`, `Court booking v1: request-based booking for SpinBuddy-owned availability at partner clubs, no payments, no sync with external booking systems (Slice K)`, `Offer/chat model: author is not a join row; players-needed computed from format+hasPartner, not stored; two thread kinds (private per-join, group per doubles offer) with no separate thread table (task 3.1)`, `club-list.tsx`, `supabase-admin.ts`, `Club Submission Form`, `next-intl`, `availability.ts`, `components.json`, `next-intl`, `devDependencies`, `admin/actions.ts`, `App Shell & Navigation`?**
  _High betweenness centrality (0.141) - this node is a cross-community bridge._
- **Should `lib_generated_prisma_enums` be split into smaller, more focused modules?**
  _Cohesion score 0.07404426559356136 - nodes in this community are weakly interconnected._
- **Why does `next` connect `new/actions.ts` to `AGENTS.md §2 Stack`, `next-intl`, `compilerOptions`, `Admin Actions & Moderation`, `club.ts`, `package.json`, `profile-form.tsx`, `report-actions.ts`, `Leaderboard Page & Filters`, `availability.ts`, `Account Deletion & Data Export`, `@sentry/nextjs`, `offers/[id]/actions.ts`, `supabase-admin.ts`, `app/offers/actions.test.ts`, `supabase-admin.ts`, `delete/actions.ts`, `dependencies`, `book/page.tsx`, `supabase-admin.ts`, `package.json`, `club-list.tsx`, `Admin Actions & Moderation`, `book/actions.ts`, `export-user-data.ts`, `notify`, `next-intl`, `createSupabaseServerClient`, `profile.ts`, `Court booking v1: request-based booking for SpinBuddy-owned availability at partner clubs, no payments, no sync with external booking systems (Slice K)`, `Offer/chat model: author is not a join row; players-needed computed from format+hasPartner, not stored; two thread kinds (private per-join, group per doubles offer) with no separate thread table (task 3.1)`, `club-list.tsx`, `supabase-admin.ts`, `options.ts`, `Club Submission Form`, `availability.ts`, `devDependencies`, `admin/actions.ts`, `New PushSubscription table, notification-preference columns on User, and a new users.email mirror column synced by ensureUserRow on every login (tasks 5.3, 5.15, 5.16)`, `Admin Actions & Moderation`, `app/offers/actions.test.ts`, `App Shell & Navigation`?**
  _High betweenness centrality (0.102) - this node is a cross-community bridge._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `Feed Ranking by ELO Closeness` and `Sparring Offer and Chat Thread Model`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._