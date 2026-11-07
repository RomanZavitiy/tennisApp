# Graph Report - tennisApp  (2026-11-07)

## Corpus Check
- 51 files · ~214,265 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2032 nodes · 5289 edges · 189 communities (97 shown, 92 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 90 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Profile & Auth Actions
- AGENTS.md §2 Stack
- availability.ts
- Profile & Player Pages
- compilerOptions
- next-intl
- Match Interest & Push Candidates
- Nav & Admin Entry Points
- login-form.tsx
- Admin Actions & Moderation
- new/actions.ts
- Auth Pages & PWA Install
- Leaderboard & Player Profile
- New Offer Form
- lib_generated_prisma_enums
- Project Docs & Decisions Index
- Account Deletion & Data Export
- PLANNING.md (v2)
- Leaderboard Page & Filters
- Club Submission Rate Limiting
- devDependencies
- next-intl
- lib_generated_prisma_enums
- Play Intent Feed (Looking For)
- next-intl
- notify.test.ts
- require-user.ts
- ClubFollow Schema & Thread Participant Check
- supabase-admin.ts
- app/offers/actions.test.ts
- result-actions.ts
- profile-form.tsx
- lib_generated_prisma_enums
- dependencies
- Club Follow Server Actions
- scripts
- Play Preferences Settings
- report-actions.ts
- result-form.tsx
- supabase-admin.ts
- PLANNING.md (v2)
- language-switcher.tsx
- ELO rating system
- zod
- @sentry/nextjs
- Account Deletion & Data Export
- CI & Analytics Decisions
- package.json
- options.ts
- book/page.tsx
- Admin Actions & Moderation
- unsubscribe/page.tsx
- captureEvent
- export-user-data.ts
- supabase-admin.ts
- result-actions.ts
- Club & Offers Pages
- Post Play Intent Flow
- package.json
- offer-form.tsx
- profile.ts
- next-intl
- supabase-admin.ts
- RLS & Storage Policy Decisions
- Booking & Account Policy Decisions
- Offer Feed & Chat Decisions
- report-actions.ts
- admin/actions.ts
- Admin Actions & Moderation
- next-intl
- result-actions.ts
- notify.ts
- AGENTS.md §8 Git workflow
- components.json
- result-actions.ts
- next-intl
- club.ts
- Play Today Flow
- Coach Data Model & Load Pipeline
- Coaching Directory Page Components
- package.json
- New PushSubscription table, notification-preference columns on User, and a new users.email mirror column synced by ensureUserRow on every login (tasks 5.3, 5.15, 5.16)
- [clubId]/page.tsx
- [clubId]/page.tsx
- Offer/chat model: author is not a join row; players-needed computed from format+hasPartner, not stored; two thread kinds (private per-join, group per doubles offer) with no separate thread table (task 3.1)
- app/offers/actions.test.ts
- lib_generated_prisma_enums
- Message Model Club Chat Extension
- login-form.tsx
- offer-interest.ts
- Auth Login Decisions
- Club Map & List Decisions
- Tech Stack Decisions
- Create Offer Decisions
- Leaderboard Page & Filters
- Deploy & Env Decisions
- Play Today Window Logic
- Account Deletion & Data Export
- offers/[id]/actions.ts
- Account Deletion & Data Export
- AGENTS.md §7 Testing instructions
- Minimum Age Decision
- engines
- next.config.ts sets agentRules:false (task 0.4)
- Prettier default settings, markdown excluded, LF via .gitattributes (task 0.7)
- Offer/chat model: author is not a join row; players-needed computed from format+hasPartner, not stored; two thread kinds (private per-join, group per doubles offer) with no separate thread table (task 3.1)
- proxy.ts (middleware) allows only an explicit PUBLIC_ROUTES allowlist, everything else redirects to /login (task 1.4)
- Community 109
- Community 111
- Community 112
- Community 157
- Community 158
- Community 159
- Community 160
- Community 162
- Community 164
- Community 165
- Community 166
- Community 167
- Community 168
- Community 169
- Community 170
- Community 173
- Community 174
- Community 175
- Community 176
- Community 177
- Community 178
- Community 179
- Community 180
- Community 181
- Community 182
- Community 183
- Community 185
- Community 186
- Community 187
- Community 188

## God Nodes (most connected - your core abstractions)
1. `next-intl` - 123 edges
2. `vitest` - 116 edges
3. `next` - 99 edges
4. `db` - 70 edges
5. `requireOnboardedUser` - 58 edges
6. `Button()` - 56 edges
7. `react` - 55 edges
8. `zod` - 43 edges
9. `captureEvent()` - 35 edges
10. `buttonVariants` - 34 edges

## Surprising Connections (you probably didn't know these)
- `submitClub()` --references--> `blockedRefusal() check`  [EXTRACTED]
  app/clubs/suggest/actions.ts → docs/TIER1-FEATURES.md
- `Club submission feature (Slice M)` --references--> `submitClub()`  [EXTRACTED]
  docs/TIER1-FEATURES.md → app/clubs/suggest/actions.ts
- `Hide/unhide an offer (Slice N)` --references--> `dismissOffer()`  [EXTRACTED]
  docs/TIER1-FEATURES.md → lib/offers/dismissals/actions.ts
- `dismissOffer()` --references--> `requestToJoin skipDuplicates idiom`  [EXTRACTED]
  lib/offers/dismissals/actions.ts → docs/TIER1-FEATURES.md
- `Admin club-submissions review queue page` --references--> `firstNameAndInitial()`  [EXTRACTED]
  docs/TIER1-FEATURES.md → lib/privacy/opponent-name.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Club Chat RLS / CHECK Schema Change** — docs_tier2_features_messages_one_thread_check, docs_tier2_features_is_message_thread_participant_fn, docs_tier2_features_messages_thread_participants_read_policy, docs_tier2_features_message_clubid_field, docs_tier2_features_session_o2 [EXTRACTED 1.00]
- **Club Follow Flow** — docs_tier2_features_clubfollow_model, docs_tier2_features_followclub_fn, docs_tier2_features_unfollowclub_fn, docs_tier2_features_follow_club_button_component, docs_tier2_features_session_o1 [EXTRACTED 1.00]
- **Club submission admin review flow** — app_admin_club_submissions_page_clubsubmissionspage, app_admin_club_submissions_actions_approvesubmission, app_admin_club_submissions_actions_rejectsubmission, lib_auth_require_admin_requireadmin [EXTRACTED 1.00]
- **Coach Data Model + Load Pipeline** — docs_tier2_features_coach_model, docs_tier2_features_coach_validation_fn, docs_tier2_features_upsert_coaches_fn, docs_tier2_features_coaches_json_data, docs_tier2_features_session_p1 [EXTRACTED 1.00]
- **The four critical end-to-end flows covered by Playwright** — agents_testing_instructions, _agents_decisions_auth_flow_e2e, _agents_decisions_offers_feed, _agents_decisions_join_transitions, _agents_decisions_result_confirmation [EXTRACTED 1.00]
- **Hide/unhide offer flow** — lib_offers_dismissals_actions_dismissoffer, components_offer_card_offercard, app_offers_hidden_page_hiddenofferspage, lib_offers_feed_filters_feedwhere [EXTRACTED 1.00]
- **Migrations applied directly, bypassing the shadow-DB break caused by auth.uid()** — _agents_decisions_migration_applied_directly_workaround, _agents_decisions_offer_court_status, _agents_decisions_system_messages_type, _agents_decisions_match_result_model, _agents_decisions_no_show_handling, _agents_decisions_notifications_schema_users_email, _agents_decisions_reports_admin_schema, _agents_decisions_polish_language_next_intl [EXTRACTED 1.00]
- **Slice-Based Session Workflow** — docs_prompts_00_readme, docs_prompts_01_session_audit_and_offer, docs_prompts_02_session_join_flow, docs_prompts_03_session_chat, docs_prompts_04_session_results_and_elo, docs_prompts_05_session_reliability, docs_prompts_06_session_courts_and_booking, docs_prompts_07_session_pwa_and_notifications, docs_prompts_08_session_safety_and_admin, docs_prompts_09_session_polish_and_profile_photo, docs_prompts_10_session_launch_readiness [EXTRACTED 1.00]
- **Three Tier-1 slices sharing a common session preamble** — docs_tier1_features_leaderboard_v1, docs_tier1_features_club_submission_feature, docs_tier1_features_hide_undo_offer, docs_tier1_features_shared_preamble [EXTRACTED 1.00]
- **RLS enabled with no policy, server-only (Prisma) access pattern** — _agents_decisions_rls_deny_by_default, _agents_decisions_messages_model_rls, _agents_decisions_club_chat_follow, _agents_decisions_club_submissions, _agents_decisions_personal_block_user_block, _agents_decisions_in_app_notifications_table [INFERRED 0.85]

## Communities (189 total, 92 thin omitted)

### Community 0 - "Profile & Auth Actions"
Cohesion: 0.05
Nodes (53): GET(), saveAvatar(), SaveAvatarResult, UpdateDiscoverableResult, updateProfile(), deleteMyAccount(), ACCEPT, AvatarUpload() (+45 more)

### Community 1 - "AGENTS.md §2 Stack"
Cohesion: 0.07
Nodes (35): admin, PNG, admin, created, PNG, signedInClient(), far, near (+27 more)

### Community 2 - "availability.ts"
Cohesion: 0.07
Nodes (33): giveConsent(), ConsentPage(), completeOnboarding(), AuthRequiredError, requireUser(), CURRENT_CONSENT_VERSION, needsConsent(), getPublicProfile() (+25 more)

### Community 3 - "Profile & Player Pages"
Cohesion: 0.07
Nodes (38): Card(), ProfilePage(), SettingsLink(), blockPlayer(), unblockPlayer(), PlayerPageProps, BlockPlayerButton(), toggle() (+30 more)

### Community 4 - "compilerOptions"
Cohesion: 0.13
Nodes (26): EditProfilePage(), OnboardingPage(), AddBlockResult, FieldErrorLike, OfferFilters(), FieldErrorLike, aria(), Field() (+18 more)

### Community 5 - "next-intl"
Cohesion: 0.07
Nodes (28): linkClubStaff(), LinkClubStaffResult, upsertClubs(), ClubRecord, clubSchema, CourtHoursRecord, courtHoursRecordSchema, CourtRecord (+20 more)

### Community 6 - "Match Interest & Push Candidates"
Cohesion: 0.10
Nodes (32): offerMatchesIntent(), offersMatchingIntent(), OpenOfferForIntent, PlayIntentInfo, DAILY_OFFER_PUSH_LIMIT, hasDailyCapacity(), hasPushCapacityNow(), interestedCandidates() (+24 more)

### Community 7 - "Nav & Admin Entry Points"
Cohesion: 0.10
Nodes (17): signOut(), HeaderNavLinks(), isActive(), NavLink, MobileNav(), NavLink, MyGames(), NotificationBell() (+9 more)

### Community 8 - "login-form.tsx"
Cohesion: 0.14
Nodes (18): RequestBookingResult, followClub(), FollowClubResult, unfollowClub(), requestToJoin(), WaitlistActionResult, FollowClubButton(), toggle() (+10 more)

### Community 9 - "Admin Actions & Moderation"
Cohesion: 0.13
Nodes (29): ActionResult, notificationSettingsSchema, removePushSubscription(), savePushSubscription(), initialStatus(), PushSubscribeControl(), disable(), enable() (+21 more)

### Community 10 - "new/actions.ts"
Cohesion: 0.12
Nodes (25): reportClubMessage(), SendClubMessageResult, reportMessage(), reportOffer(), BlockPlayerResult, reportPlayer(), canWriteToClubThread(), canWriteToThread() (+17 more)

### Community 11 - "Auth Pages & PWA Install"
Cohesion: 0.11
Nodes (16): ErrorPage(), sendMagicLink(), SendMagicLinkResult, LoginPage(), LoginPageProps, DeleteAccountPage(), AdminAction, AdminActionResult (+8 more)

### Community 12 - "Leaderboard & Player Profile"
Cohesion: 0.09
Nodes (26): LeaderboardPage(), PlayerPage(), InvitePlayerButton(), LeaderboardFiltersForm(), LeaderboardRow(), NTRP_MIN/MAX/STEP constants, PlayerLink-style pattern, Coaches Query Zod Schema (+18 more)

### Community 13 - "New Offer Form"
Cohesion: 0.12
Nodes (22): NewOfferPage(), aria(), ClubOption, ErrorText(), Field(), FieldErrorLike, NtrpSelect(), OfferForm() (+14 more)

### Community 14 - "lib_generated_prisma_enums"
Cohesion: 0.13
Nodes (22): markCourtBooked(), trackCandidatesViewed(), acceptInvite(), declineInvite(), generateMetadata(), OfferPage(), OfferPageProps, PlayerView() (+14 more)

### Community 15 - "Project Docs & Decisions Index"
Cohesion: 0.09
Nodes (27): .agents/decisions.md decisions log, AGENTS.md (single source of truth), Admin club-submissions review queue page, Hidden offers view / Unhide, CLAUDE.md project instructions, leaderboard-filters client form, docs/BOOKING-EPIC.md (Slice K), Club submission feature (Slice M) (+19 more)

### Community 16 - "Account Deletion & Data Export"
Cohesion: 0.15
Nodes (20): AccountDeletedPage(), Home(), ClubFiltersForm(), ClubList(), ClubListEntry(), ClubListItem, ClubMapMarker, ClubMapProps (+12 more)

### Community 17 - "PLANNING.md (v2)"
Cohesion: 0.14
Nodes (20): acceptJoin(), cancelOffer(), changeJoin(), declineJoin(), RequestToJoinResult, SendMessageResult, withdrawJoin(), THREAD_WELCOME_MESSAGE (+12 more)

### Community 18 - "Leaderboard Page & Filters"
Cohesion: 0.08
Nodes (27): engines, node, name, packageManager, private, version, README stack glossary table, class-variance-authority (+19 more)

### Community 19 - "Club Submission Rate Limiting"
Cohesion: 0.15
Nodes (20): addDays(), ClubPanelPage(), metadata, AddBlockForm(), AdminActionForm(), ClubStaffSession, requireClubStaff, SessionUser (+12 more)

### Community 20 - "devDependencies"
Cohesion: 0.12
Nodes (17): cancelBooking(), BookingGroup(), MyBookings(), STATUS_STYLE, BOOKING_CANCEL_WINDOW_HOURS, canCancelBooking(), bookingDurationMinutes(), BookingRow (+9 more)

### Community 21 - "next-intl"
Cohesion: 0.13
Nodes (15): ClubChatPage(), ClubChatPageProps, generateMetadata(), generateMetadata(), ClubDetails, Formatter, getClub(), getClubFollowInfo() (+7 more)

### Community 22 - "lib_generated_prisma_enums"
Cohesion: 0.12
Nodes (14): leaveWaitlist(), InviteRefusal, JoinRefusal, WAITLIST_RESPONSE_WINDOW_HOURS, WAITLIST_URGENT_RESPONSE_WINDOW_HOURS, WAITLIST_URGENT_THRESHOLD_HOURS, WaitlistJoinRefusal, waitlistPosition() (+6 more)

### Community 23 - "Play Intent Feed (Looking For)"
Cohesion: 0.18
Nodes (14): LookingForGamePage(), IntentCard(), IntentCardData, IntentFilters(), nextDay(), parseFeedFilters(), MyOpenOffer, getPlayIntentFeed() (+6 more)

### Community 24 - "next-intl"
Cohesion: 0.12
Nodes (19): getClient(), sendEmail(), SendEmailInput, SendEmailOutcome, EmailTemplateInput, escapeHtml(), renderEmailHtml(), renderEmailText() (+11 more)

### Community 25 - "notify.test.ts"
Cohesion: 0.14
Nodes (20): JoinChangeResult, confirmResult(), disputeResult(), ErrorsT, loadSubmittableJoin(), PendingResult, SettleAction, SettleOutcome (+12 more)

### Community 26 - "require-user.ts"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 27 - "ClubFollow Schema & Thread Participant Check"
Cohesion: 0.15
Nodes (16): ActionResult, ErrorText(), FieldErrorLike, GamesRow(), ResultForm(), gamesSchema(), isValidRegularSet(), isValidSet() (+8 more)

### Community 28 - "supabase-admin.ts"
Cohesion: 0.09
Nodes (22): dependencies, @base-ui/react, class-variance-authority, cn, @hookform/resolvers, leaflet, lucide-react, next (+14 more)

### Community 29 - "app/offers/actions.test.ts"
Cohesion: 0.09
Nodes (22): devDependencies, eslint, eslint-config-next, eslint-config-prettier, husky, lint-staged, @playwright/test, prettier (+14 more)

### Community 30 - "result-actions.ts"
Cohesion: 0.16
Nodes (17): sendClubMessage(), sendMessage(), JoinThread(), MessageRow, MessageThread(), addMessage(), submit(), threadColumn() (+9 more)

### Community 31 - "profile-form.tsx"
Cohesion: 0.13
Nodes (16): createOffer(), INVITE_SOURCES, InviteChangeResult, InviteResult, inviteToOffer(), joinWaitlist(), isBlockedEitherWay(), SendInviteOutcome (+8 more)

### Community 32 - "lib_generated_prisma_enums"
Cohesion: 0.16
Nodes (14): Candidate, CandidateOffer, CandidatePlayer, isEligible(), MAX_CANDIDATES, MIN_RELIABILITY_PERCENT, rankCandidates(), eloDistance() (+6 more)

### Community 33 - "dependencies"
Cohesion: 0.22
Nodes (13): AdminActionResult, annulDisputedResult(), blockFromReport(), confirmDisputedResult(), dismissReport(), hideReport(), logAction(), unblockPlayer() (+5 more)

### Community 34 - "Club Follow Server Actions"
Cohesion: 0.14
Nodes (17): submitClub(), blockedRefusal() check, createOffer (reference usage of blockedRefusal), RATE_LIMITS, ADDRESS_MAX, CLUB_SUBMISSION_FIELDS, clubSubmissionFieldErrors(), ClubSubmissionInput (+9 more)

### Community 35 - "scripts"
Cohesion: 0.17
Nodes (12): MemberLayout(), exportMyData(), ExportDataPage(), NotificationSettingsPage(), ExportDataButton(), download(), requestToJoin skipDuplicates idiom, requireOnboardedUser (+4 more)

### Community 36 - "Play Preferences Settings"
Cohesion: 0.17
Nodes (14): ActionResult, playPreferencesSchema, updatePlayPreferences(), PlayPreferencesPage(), PlayPreferences, PlayPreferencesForm(), save(), toggled() (+6 more)

### Community 37 - "report-actions.ts"
Cohesion: 0.14
Nodes (16): BOOKING_DURATIONS, BOOKING_FIELDS, BOOKING_MAX_DAYS_AHEAD, BOOKING_NOTE_MAX, BookingDuration, BookingRequestInput, bookingRequestSchema(), BookingRequestValues (+8 more)

### Community 38 - "result-form.tsx"
Cohesion: 0.17
Nodes (10): activeOffersWhere(), MAX_ACTIVE_OFFERS, WaitlistPromotion, applyMatchElo(), applyMatchEloFromJoin(), PendingResultJoin, computeEloChange(), expectedScore() (+2 more)

### Community 39 - "supabase-admin.ts"
Cohesion: 0.18
Nodes (14): NotificationsPage(), MarkNotificationsRead(), NOTIFICATIONS_CHANGED_EVENT, listNotifications(), formatLabel(), Formatter, LabelT, levelLabel() (+6 more)

### Community 40 - "PLANNING.md (v2)"
Cohesion: 0.17
Nodes (15): ACTION_ACTOR, JoinAction, joinChangeRefusal, nextJoinStatus(), OfferState, offerStatusFor(), TRANSITIONS, playersNeeded() (+7 more)

### Community 41 - "language-switcher.tsx"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 42 - "ELO rating system"
Cohesion: 0.19
Nodes (11): GET(), COURT_BOOKED_MESSAGE, postSystemMessage(), RESULT_AUTO_CONFIRMED_MESSAGE, ThreadRef, autoConfirmExpiredResults(), { autoConfirmExpiredResults, runNotificationReminders }, { messageCreate } (+3 more)

### Community 43 - "zod"
Cohesion: 0.21
Nodes (13): markNotificationsReadAction(), offerIdSchema, unreadNotificationCount(), getCurrentUser(), countUnreadNotifications(), InboxNotification, markNotificationsRead(), NOTIFICATIONS_SHOWN (+5 more)

### Community 44 - "@sentry/nextjs"
Cohesion: 0.19
Nodes (14): ClubMap(), FIT_PADDING, FitToContainer(), KRAKOW_CENTER, ShowClubPickedInList(), markerIconDefault, ClubSelection, ClubSelectionContext (+6 more)

### Community 45 - "Account Deletion & Data Export"
Cohesion: 0.17
Nodes (9): vitest, en, testTranslator(), t, schema, schema, t, schema (+1 more)

### Community 46 - "CI & Analytics Decisions"
Cohesion: 0.12
Nodes (13): requestBooking(), notifyBookingRequested(), PENDING_BOOKING, {
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
}, STARTS_AT, validInput, { createUnsubscribeToken }, NOW (+5 more)

### Community 47 - "package.json"
Cohesion: 0.18
Nodes (14): BLOCKING_BOOKING_STATUSES, BlockingBookingStatus, BookingInput, buildDayGrid(), BuildDayGridInput, buildDayWindows(), canFit(), CourtBlockInput (+6 more)

### Community 48 - "options.ts"
Cohesion: 0.21
Nodes (13): FEED_PAGE_SIZE, FeedOffer, feedOfferSelect, FeedPage, FeedFilters, feedWhere(), getClubOffers(), getOfferFeed() (+5 more)

### Community 49 - "book/page.tsx"
Cohesion: 0.20
Nodes (16): MEMORY.md (agent working notes), Claude Code Planning Prompt, PLANNING-v1.md (archived), Launch Checklist — MatchFinder Kraków, Session Prompts Overview, Session 01: Audit and Offer, Session 02: Join Flow, Session 03: Chat (+8 more)

### Community 50 - "Admin Actions & Moderation"
Cohesion: 0.25
Nodes (10): confirmUnsubscribe(), UnsubscribeResult, UnsubscribePage(), UnsubscribePageProps, UnsubscribeButton(), createUnsubscribeToken(), secret(), sign() (+2 more)

### Community 51 - "unsubscribe/page.tsx"
Cohesion: 0.28
Nodes (14): notify(), advanceStaleWaitlistOffers(), autoDeclinePendingBookings(), expirePendingInvites(), krakowTimeRangeLabel(), ReminderCounts, runNotificationReminders(), sendHowDidItGoPrompts() (+6 more)

### Community 52 - "captureEvent"
Cohesion: 0.12
Nodes (16): scripts, build, check:i18n-keys, check:i18n-strings, clubs:load, dev, format, format:check (+8 more)

### Community 53 - "export-user-data.ts"
Cohesion: 0.17
Nodes (4): ClubSubmission model, SpinBuddy project summary, Slice D: chat (messages, system messages, realtime), Message Model

### Community 54 - "supabase-admin.ts"
Cohesion: 0.22
Nodes (12): AdminReportsPage(), metadata, AdminResultsPage(), metadata, BlockedPlayer, DisputedResult, getBlockedPlayers(), getDisputedResults() (+4 more)

### Community 55 - "result-actions.ts"
Cohesion: 0.24
Nodes (11): addBlock(), ClubPanelActionResult, confirmBooking(), declineBooking(), overlapsABooking(), removeBlock(), isExclusionViolation(), notifyBookingDecided() (+3 more)

### Community 56 - "Club & Offers Pages"
Cohesion: 0.22
Nodes (9): ClubPage(), ClubPageProps, OffersPage(), ExternalLink(), SignInToFollowLink(), OfferCard(), formatCheckedDate(), feedHref() (+1 more)

### Community 57 - "Post Play Intent Flow"
Cohesion: 0.16
Nodes (13): postPlayIntent(), ErrorText(), Field(), PostIntentForm(), emptyToUndefined(), NOTE_MAX, PLAY_INTENT_FIELDS, playIntentFieldErrors() (+5 more)

### Community 58 - "package.json"
Cohesion: 0.23
Nodes (12): BookingGrid(), Formatter, LEGEND_SWATCH, overlapsRange(), T, timeLabel(), DaySlot, SlotStatus (+4 more)

### Community 59 - "offer-form.tsx"
Cohesion: 0.18
Nodes (12): InviteAction, InviteChangeRefusal, nextInviteStatus(), OfferState, TRANSITIONS, doubles, doublesWithPartner, LATER (+4 more)

### Community 60 - "profile.ts"
Cohesion: 0.14
Nodes (6): OfferInvite model, OfferJoin model, Slice A: sync plan with code, lighten process, Slice B: finish the offer (age 18, court status), Slice C: request and acceptance (main loop), Slice G: courts and external booking links

### Community 61 - "next-intl"
Cohesion: 0.18
Nodes (12): UserBlock model, Korteo (korteo.pl) multi-sport matchmaking platform, Slice Q: Play again + share button + OG preview, Slice R: personal player blocking, Slice S1: invite a player into an offer (OfferInvite), Slice S2: matched candidates on own offer, Slice T: waitlist for a full offer (OfferWaitlist), Slice U1: play preferences (days/times/districts) (+4 more)

### Community 62 - "supabase-admin.ts"
Cohesion: 0.21
Nodes (13): Booking (booking schema entity), Club.bookingMode enum (EXTERNAL_LINK / SPINBUDDY), ClubStaff (booking schema entity), Court (booking schema entity), CourtBlock (booking schema entity), CourtHours (booking schema entity), Session 0 — Epic setup, Session 11 — Decision + data model (K.1-K.5) (+5 more)

### Community 63 - "RLS & Storage Policy Decisions"
Cohesion: 0.31
Nodes (6): onRequestError, register(), scrubEvent(), nextConfig, withNextIntl, @sentry/nextjs

### Community 64 - "Booking & Account Policy Decisions"
Cohesion: 0.17
Nodes (5): AdminAction model, RateLimitCounter model, Report model, AGENTS.md approved tech stack list, Slice I: security and minimal admin

### Community 65 - "Offer Feed & Chat Decisions"
Cohesion: 0.24
Nodes (9): AdminActionResult, approveSubmission(), rejectSubmission(), AdminClubSubmissionsPage(), metadata, New NotificationKind value (submitter decision notice), notify()/sendEmail() pattern, getOpenClubSubmissions() (+1 more)

### Community 66 - "report-actions.ts"
Cohesion: 0.27
Nodes (10): addDays(), BookPage(), BookPageProps, dateOptions(), hrefWith(), Params, parseDate(), parseDuration() (+2 more)

### Community 67 - "admin/actions.ts"
Cohesion: 0.24
Nodes (7): geistMono, geistSans, RootLayout(), viewport, RegisterServiceWorker(), SiteFooter(), SiteHeader()

### Community 68 - "Admin Actions & Moderation"
Cohesion: 0.29
Nodes (8): updateDiscoverable(), updateNotificationSetting(), DiscoverableToggle(), NotificationSettings, NotificationSettingsForm(), toggle(), ROW_KEYS, Switch()

### Community 69 - "next-intl"
Cohesion: 0.22
Nodes (5): keyPaths(), main(), Messages, { findUnique, followCount, followFindUnique }, en

### Community 70 - "result-actions.ts"
Cohesion: 0.24
Nodes (7): isOfferDuration(), OFFER_DURATIONS, OfferDuration, fields, SearchParams, BASE, NOW

### Community 71 - "notify.ts"
Cohesion: 0.29
Nodes (9): AddBlockInput, addBlockSchema(), AddBlockValues, CLUB_PANEL_REASON_MAX, declineReasonSchema(), emptyToUndefined(), localDateTime(), reasonSchema() (+1 more)

### Community 72 - "AGENTS.md §8 Git workflow"
Cohesion: 0.31
Nodes (3): MatchResult model, Slice E: match result and ELO, Slice F: player reliability (no-show, late cancellation)

### Community 73 - "components.json"
Cohesion: 0.24
Nodes (7): SuggestClubPage(), aria(), ClubSubmissionForm(), ErrorText(), Field(), OfferForm shape pattern, ProfileForm shape pattern

### Community 74 - "result-actions.ts"
Cohesion: 0.38
Nodes (8): daysAhead(), offerEndsAt(), formatKrakowTimeRange(), Formatter, krakowHour(), krakowLocalToDate(), krakowParts, toKrakowLocal()

### Community 75 - "next-intl"
Cohesion: 0.27
Nodes (7): partyOf(), settleResultRefusal, submitResultRefusal, FUTURE, join, NOW, PAST

### Community 76 - "club.ts"
Cohesion: 0.36
Nodes (5): recordOutboundClick(), BookingLink(), track(), addUtmSource(), { getCurrentUser, create }

### Community 77 - "Play Today Flow"
Cohesion: 0.36
Nodes (5): trackPlayTodayEmptyState(), trackPlayTodayResultSelected(), trackPlayTodayViewed(), PlayTodayPage(), MarkPlayTodayEvent()

### Community 78 - "Coach Data Model & Load Pipeline"
Cohesion: 0.25
Nodes (8): blockedRefusal(), FollowClubButton Component, followClub(), requestToJoin() skipDuplicates Idiom (N.4), requireOnboardedUser(), sendClubMessage(), sendMessage() (app/offers/[id]/actions.ts), unfollowClub()

### Community 79 - "Coaching Directory Page Components"
Cohesion: 0.22
Nodes (9): ClubFollow Model, export-user-data.ts (GDPR export), firstNameAndInitial() (lib/privacy/opponent-name.ts), getClub() (lib/clubs/club-details.ts), getClubThread(), is_message_thread_participant() SECURITY DEFINER Function, "messages: thread participants can read" RLS Policy, offer_dismissals RLS-No-Policy Pattern (+1 more)

### Community 80 - "package.json"
Cohesion: 0.25
Nodes (7): CourtDayGrid, BLOCKING_BOOKING_STATUSES, DayGrid, DayGridCourt, getDayGrid(), CLUB_ROW, { findFirst, findBookings, findBlocks }

### Community 82 - "[clubId]/page.tsx"
Cohesion: 0.36
Nodes (6): Club Chat Feature, .agents/decisions.md, notify() Function, Session O1: Follow a Club, Session O2: Club Chat (Message.clubId + RLS), Slice O

### Community 83 - "[clubId]/page.tsx"
Cohesion: 0.32
Nodes (7): ensureVapidConfigured(), isExpired(), PushPayload, PushSubscriptionKeys, sendPush(), SendPushOutcome, web-push

### Community 84 - "Offer/chat model: author is not a join row; players-needed computed from format+hasPartner, not stored; two thread kinds (private per-join, group per doubles offer) with no separate thread table (task 3.1)"
Cohesion: 0.39
Nodes (6): loginSchema(), LoginValues, magicLinkRequestSchema(), ValidationT, emailError(), t

### Community 86 - "lib_generated_prisma_enums"
Cohesion: 0.48
Nodes (3): MarkMeaningfulAction(), hasMeaningfulAction(), markMeaningfulAction()

### Community 87 - "Message Model Club Chat Extension"
Cohesion: 0.29
Nodes (7): ClubFiltersForm Component, CoachCard Component, CoachFilters Component, app/coaches/page.tsx, ExternalLink Component, getCoaches(), leaderboard-filters Component

### Community 88 - "login-form.tsx"
Cohesion: 0.29
Nodes (6): AnalyticsEvent, EventProperties, InviteSource, OfferFormat, OutboundTarget, PropertiesFor

### Community 89 - "offer-interest.ts"
Cohesion: 0.48
Nodes (5): AUTOBLOCK_THRESHOLD, AUTOBLOCK_WINDOW_DAYS, maybeAutoblock(), shouldAutoblock(), { reportFindMany, userUpdateMany, adminActionCreate }

### Community 90 - "Auth Login Decisions"
Cohesion: 0.33
Nodes (3): Club Model, Message.clubId Field, messages_one_thread_check Constraint

### Community 92 - "Tech Stack Decisions"
Cohesion: 0.47
Nodes (4): Coaching Directory Feature, Session P1: Coach Data Model + Load Pipeline, Session P2: Coaching Directory Page, Slice P

### Community 93 - "Create Offer Decisions"
Cohesion: 0.33
Nodes (6): Coach Model, Coach Zod Schema (lib/validation/coach.ts), prisma/data/coaches.json, CoachLevel Enum, upsertCoaches(), upsert-clubs.ts / load-clubs.ts

### Community 94 - "Leaderboard Page & Filters"
Cohesion: 0.33
Nodes (5): eslintConfig, eslint, eslint-config-next, eslint-config-prettier, typescript-eslint

### Community 96 - "Play Today Window Logic"
Cohesion: 0.60
Nodes (3): isPlayingSoon(), PLAY_TODAY_WINDOW_HOURS, NOW

### Community 97 - "Account Deletion & Data Export"
Cohesion: 0.40
Nodes (4): input, { reportCreateManyAndReturn, checkRateLimit, maybeAutoblock }, t, tRateLimit

### Community 98 - "offers/[id]/actions.ts"
Cohesion: 0.40
Nodes (3): NOW, OFFER, { userFindMany, userUpdate, notify }

### Community 103 - "next.config.ts sets agentRules:false (task 0.4)"
Cohesion: 0.67
Nodes (3): app/admin/reports Page, reportClubMessage(), reportMessage() (app/offers/[id]/report-actions.ts)

### Community 104 - "Prettier default settings, markdown excluded, LF via .gitattributes (task 0.7)"
Cohesion: 0.67
Nodes (3): lint-staged, *.{json,css,yaml,yml}, *.{ts,tsx,mts,js,mjs}

## Knowledge Gaps
- **113 isolated node(s):** `husky`, `lint-staged`, `prettier`, `@prisma/client`, `react-dom` (+108 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 772 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **92 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `Account Deletion & Data Export` to `Profile & Auth Actions`, `availability.ts`, `Profile & Player Pages`, `next-intl`, `Match Interest & Push Candidates`, `Nav & Admin Entry Points`, `login-form.tsx`, `Admin Actions & Moderation`, `new/actions.ts`, `Leaderboard & Player Profile`, `New Offer Form`, `Account Deletion & Data Export`, `PLANNING.md (v2)`, `Leaderboard Page & Filters`, `Club Submission Rate Limiting`, `devDependencies`, `next-intl`, `lib_generated_prisma_enums`, `Play Intent Feed (Looking For)`, `notify.test.ts`, `profile-form.tsx`, `lib_generated_prisma_enums`, `dependencies`, `Club Follow Server Actions`, `scripts`, `Play Preferences Settings`, `report-actions.ts`, `result-form.tsx`, `supabase-admin.ts`, `PLANNING.md (v2)`, `ELO rating system`, `zod`, `CI & Analytics Decisions`, `package.json`, `options.ts`, `Admin Actions & Moderation`, `unsubscribe/page.tsx`, `result-actions.ts`, `package.json`, `offer-form.tsx`, `RLS & Storage Policy Decisions`, `Offer Feed & Chat Decisions`, `next-intl`, `result-actions.ts`, `notify.ts`, `result-actions.ts`, `next-intl`, `club.ts`, `package.json`, `Offer/chat model: author is not a join row; players-needed computed from format+hasPartner, not stored; two thread kinds (private per-join, group per doubles offer) with no separate thread table (task 3.1)`, `lib_generated_prisma_enums`, `offer-interest.ts`, `Play Today Window Logic`, `Account Deletion & Data Export`, `offers/[id]/actions.ts`, `Account Deletion & Data Export`, `Offer/chat model: author is not a join row; players-needed computed from format+hasPartner, not stored; two thread kinds (private per-join, group per doubles offer) with no separate thread table (task 3.1)`?**
  _High betweenness centrality (0.152) - this node is a cross-community bridge._
- **What connects `husky`, `lint-staged`, `prettier` to the rest of the system?**
  _113 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Profile & Auth Actions` be split into smaller, more focused modules?**
  _Cohesion score 0.05185185185185185 - nodes in this community are weakly interconnected._
- **Why does `next-intl` connect `Auth Pages & PWA Install` to `Profile & Auth Actions`, `availability.ts`, `Profile & Player Pages`, `compilerOptions`, `Nav & Admin Entry Points`, `login-form.tsx`, `Admin Actions & Moderation`, `new/actions.ts`, `Leaderboard & Player Profile`, `New Offer Form`, `lib_generated_prisma_enums`, `Account Deletion & Data Export`, `PLANNING.md (v2)`, `Leaderboard Page & Filters`, `Club Submission Rate Limiting`, `devDependencies`, `next-intl`, `lib_generated_prisma_enums`, `Play Intent Feed (Looking For)`, `next-intl`, `notify.test.ts`, `ClubFollow Schema & Thread Participant Check`, `result-actions.ts`, `profile-form.tsx`, `dependencies`, `Club Follow Server Actions`, `scripts`, `Play Preferences Settings`, `report-actions.ts`, `supabase-admin.ts`, `@sentry/nextjs`, `Account Deletion & Data Export`, `Admin Actions & Moderation`, `supabase-admin.ts`, `result-actions.ts`, `Club & Offers Pages`, `package.json`, `RLS & Storage Policy Decisions`, `Offer Feed & Chat Decisions`, `report-actions.ts`, `admin/actions.ts`, `Admin Actions & Moderation`, `next-intl`, `components.json`, `result-actions.ts`, `Play Today Flow`?**
  _High betweenness centrality (0.134) - this node is a cross-community bridge._
- **Should `AGENTS.md §2 Stack` be split into smaller, more focused modules?**
  _Cohesion score 0.07404426559356136 - nodes in this community are weakly interconnected._
- **Why does `Coach Zod Schema (lib/validation/coach.ts)` connect `Create Offer Decisions` to `next-intl`?**
  _High betweenness centrality (0.118) - this node is a cross-community bridge._
- **Should `availability.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0677555958862674 - nodes in this community are weakly interconnected._