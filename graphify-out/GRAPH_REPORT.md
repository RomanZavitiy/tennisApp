# Graph Report - tennisApp  (2026-11-07)

## Corpus Check
- 19 files · ~218,962 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2072 nodes · 5470 edges · 161 communities (92 shown, 69 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 96 edges (avg confidence: 0.84)
- Token cost: 0 input · 201,843 output

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
- Community 65
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
- Community 84
- Community 85
- Community 86
- Community 87
- Community 88
- Community 89
- Community 90
- Community 91
- Community 92
- Community 93
- Community 94
- Community 95
- Community 96
- Community 97
- Community 98
- Community 99
- Community 100
- Community 101
- Community 102
- Community 104
- Community 105
- Community 106
- Community 107
- Community 124
- Community 125
- Community 127
- Community 128
- Community 130
- Community 131
- Community 132
- Community 133
- Community 135
- Community 136
- Community 137
- Community 138
- Community 139
- Community 140
- Community 141
- Community 142
- Community 145
- Community 146
- Community 147
- Community 148
- Community 149
- Community 150
- Community 151
- Community 152
- Community 153
- Community 154
- Community 155
- Community 157
- Community 158
- Community 159
- Community 160

## God Nodes (most connected - your core abstractions)
1. `next-intl` - 126 edges
2. `vitest` - 119 edges
3. `next` - 102 edges
4. `db` - 71 edges
5. `requireOnboardedUser` - 58 edges
6. `Button()` - 57 edges
7. `react` - 55 edges
8. `zod` - 45 edges
9. `captureEvent()` - 35 edges
10. `buttonVariants` - 34 edges

## Surprising Connections (you probably didn't know these)
- `LeaderboardPage()` --references--> `PlayerLink-style pattern`  [EXTRACTED]
  app/leaderboard/page.tsx → docs/TIER1-FEATURES.md
- `Leaderboard v1 (Slice L)` --references--> `LeaderboardPage()`  [EXTRACTED]
  docs/TIER1-FEATURES.md → app/leaderboard/page.tsx
- `Leaderboard v1 (Slice L)` --references--> `LeaderboardRow()`  [EXTRACTED]
  docs/TIER1-FEATURES.md → components/leaderboard-row.tsx
- `Leaderboard v1 (Slice L)` --references--> `getLeaderboard()`  [EXTRACTED]
  docs/TIER1-FEATURES.md → lib/leaderboard/get-leaderboard.ts
- `getLeaderboard()` --references--> `NTRP_MIN/MAX/STEP constants`  [EXTRACTED]
  lib/leaderboard/get-leaderboard.ts → docs/TIER1-FEATURES.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **RLS deny-by-default with Prisma as sole writer, breached only via private-schema SECURITY DEFINER functions** — _agents_decisions_rls_deny_by_default, _agents_decisions_rls_strategy_prisma, _agents_decisions_messages_model_rls, _agents_decisions_private_schema_security_definer_pattern [EXTRACTED 0.90]
- **Direct-apply + migrate resolve workaround shared across every migration since 3.15** — _agents_decisions_migration_shadow_db_workaround, _agents_decisions_messages_model_rls, _agents_decisions_notifications_schema_email, _agents_decisions_club_submissions_table, _agents_decisions_user_block [EXTRACTED 0.95]
- **Club Chat RLS / CHECK Schema Change** — docs_tier2_features_messages_one_thread_check, docs_tier2_features_is_message_thread_participant_fn, docs_tier2_features_messages_thread_participants_read_policy, docs_tier2_features_message_clubid_field, docs_tier2_features_session_o2 [EXTRACTED 1.00]
- **Club Follow Flow** — docs_tier2_features_clubfollow_model, docs_tier2_features_followclub_fn, docs_tier2_features_unfollowclub_fn, docs_tier2_features_follow_club_button_component, docs_tier2_features_session_o1 [EXTRACTED 1.00]
- **Club submission admin review flow** — app_admin_club_submissions_page_clubsubmissionspage, app_admin_club_submissions_actions_approvesubmission, app_admin_club_submissions_actions_rejectsubmission, lib_auth_require_admin_requireadmin [EXTRACTED 1.00]
- **Coach Data Model + Load Pipeline** — docs_tier2_features_coach_model, docs_tier2_features_coach_validation_fn, docs_tier2_features_upsert_coaches_fn, docs_tier2_features_coaches_json_data, docs_tier2_features_session_p1 [EXTRACTED 1.00]
- **Hide/unhide offer flow** — lib_offers_dismissals_actions_dismissoffer, components_offer_card_offercard, app_offers_hidden_page_hiddenofferspage, lib_offers_feed_filters_feedwhere [EXTRACTED 1.00]
- **Slice-Based Session Workflow** — docs_prompts_00_readme, docs_prompts_01_session_audit_and_offer, docs_prompts_02_session_join_flow, docs_prompts_03_session_chat, docs_prompts_04_session_results_and_elo, docs_prompts_05_session_reliability, docs_prompts_06_session_courts_and_booking, docs_prompts_07_session_pwa_and_notifications, docs_prompts_08_session_safety_and_admin, docs_prompts_09_session_polish_and_profile_photo, docs_prompts_10_session_launch_readiness [EXTRACTED 1.00]
- **Three Tier-1 slices sharing a common session preamble** — docs_tier1_features_leaderboard_v1, docs_tier1_features_club_submission_feature, docs_tier1_features_hide_undo_offer, docs_tier1_features_shared_preamble [EXTRACTED 1.00]
- **Offer lifecycle: creation, join request, accept/decline/withdraw, cancellation** — _agents_decisions_create_offer_action, _agents_decisions_request_to_join_action, _agents_decisions_join_transitions, _agents_decisions_offer_detail_page, _agents_decisions_cancel_offer [INFERRED 0.85]

## Communities (161 total, 69 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (57): GET(), JoinChangeResult, confirmResult(), disputeResult(), ErrorsT, loadSubmittableJoin(), PendingResult, SettleAction (+49 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (37): admin, PNG, admin, created, PNG, signedInClient(), far, near (+29 more)

### Community 2 - "Community 2"
Cohesion: 0.07
Nodes (41): GET(), LoginPage(), LoginPageProps, saveAvatar(), ACCEPT, AvatarUpload(), choose(), reset() (+33 more)

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (31): linkClubStaff(), LinkClubStaffResult, upsertClubs(), upsertCoaches(), activeOffersWhere(), MAX_ACTIVE_OFFERS, ClubRecord, clubSchema (+23 more)

### Community 4 - "Community 4"
Cohesion: 0.08
Nodes (40): AdminActionResult, annulDisputedResult(), blockFromReport(), confirmDisputedResult(), dismissReport(), hideReport(), logAction(), unblockPlayer() (+32 more)

### Community 5 - "Community 5"
Cohesion: 0.07
Nodes (36): advanceStaleWaitlistOffers(), autoDeclinePendingBookings(), expirePendingInvites(), krakowTimeRangeLabel(), ReminderCounts, runNotificationReminders(), sendHowDidItGoPrompts(), sendMatchReminders() (+28 more)

### Community 6 - "Community 6"
Cohesion: 0.09
Nodes (35): offerMatchesIntent(), offersMatchingIntent(), OpenOfferForIntent, PlayIntentInfo, DAILY_OFFER_PUSH_LIMIT, hasDailyCapacity(), hasPushCapacityNow(), interestedCandidates() (+27 more)

### Community 7 - "Community 7"
Cohesion: 0.05
Nodes (38): blockedRefusal(), Club Chat Feature, Club Model, ClubFollow Model, Coach Model, Coach Zod Schema (lib/validation/coach.ts), prisma/data/coaches.json, Coaching Directory Feature (+30 more)

### Community 8 - "Community 8"
Cohesion: 0.08
Nodes (28): recordOutboundClick(), ClubPage(), ClubPageProps, CoachesPage(), BookingLink(), track(), CoachCard(), CoachFiltersForm() (+20 more)

### Community 9 - "Community 9"
Cohesion: 0.11
Nodes (20): RequestBookingResult, createOffer(), requestToJoin(), INVITE_SOURCES, InviteChangeResult, InviteResult, inviteToOffer(), joinWaitlist() (+12 more)

### Community 10 - "Community 10"
Cohesion: 0.10
Nodes (32): acceptJoin(), cancelOffer(), changeJoin(), declineJoin(), RequestToJoinResult, SendMessageResult, withdrawJoin(), COURT_BOOKED_MESSAGE (+24 more)

### Community 11 - "Community 11"
Cohesion: 0.09
Nodes (31): sendClubMessage(), ClubChatPage(), ClubChatPageProps, generateMetadata(), sendMessage(), JoinThread(), MessageRow, MessageThread() (+23 more)

### Community 12 - "Community 12"
Cohesion: 0.10
Nodes (18): giveConsent(), ConsentPage(), ActionResult, playPreferencesSchema, completeOnboarding(), OnboardingPage(), AuthRequiredError, requireUser() (+10 more)

### Community 13 - "Community 13"
Cohesion: 0.10
Nodes (22): geistMono, geistSans, RootLayout(), viewport, markNotificationsReadAction(), offerIdSchema, unreadNotificationCount(), NotificationsPage() (+14 more)

### Community 14 - "Community 14"
Cohesion: 0.12
Nodes (23): AdminActionResult, reportClubMessage(), SendClubMessageResult, MemberLayout(), ExportDataPage(), reportMessage(), reportOffer(), BlockPlayerResult (+15 more)

### Community 15 - "Community 15"
Cohesion: 0.15
Nodes (22): sendMagicLink(), updateDiscoverable(), AddBlockResult, AdminAction, AdminActionResult, FieldErrorLike, DiscoverableToggle(), LoginForm() (+14 more)

### Community 16 - "Community 16"
Cohesion: 0.11
Nodes (26): NewOfferPage(), aria(), ClubOption, ErrorText(), Field(), FieldErrorLike, NtrpSelect(), OfferForm() (+18 more)

### Community 17 - "Community 17"
Cohesion: 0.12
Nodes (25): trackCandidatesViewed(), acceptInvite(), declineInvite(), generateMetadata(), OfferPage(), OfferPageProps, PlayerView(), CandidatesSection() (+17 more)

### Community 18 - "Community 18"
Cohesion: 0.09
Nodes (26): LeaderboardPage(), PlayerPage(), InvitePlayerButton(), LeaderboardFiltersForm(), LeaderboardRow(), NTRP_MIN/MAX/STEP constants, PlayerLink-style pattern, Coaches Query Zod Schema (+18 more)

### Community 19 - "Community 19"
Cohesion: 0.11
Nodes (23): OffersPage(), OfferCard(), FEED_PAGE_SIZE, FeedOffer, feedOfferSelect, FeedPage, feedHref(), feedWhere() (+15 more)

### Community 20 - "Community 20"
Cohesion: 0.15
Nodes (25): removePushSubscription(), savePushSubscription(), initialStatus(), PushSubscribeControl(), disable(), enable(), Status, dismiss() (+17 more)

### Community 21 - "Community 21"
Cohesion: 0.07
Nodes (28): eslintConfig, engines, node, name, packageManager, private, version, class-variance-authority (+20 more)

### Community 22 - "Community 22"
Cohesion: 0.16
Nodes (12): AccountDeletedPage(), ErrorPage(), MobileNav(), NavLink, Button(), buttonVariants, Sheet(), SheetContent() (+4 more)

### Community 23 - "Community 23"
Cohesion: 0.16
Nodes (11): signOut(), SendMagicLinkResult, deleteMyAccount(), DeleteAccountPage(), deleteAccountStorageAndAuth(), redactAccountData(), createSupabaseAdminClient(), createSupabaseServerClient() (+3 more)

### Community 24 - "Community 24"
Cohesion: 0.18
Nodes (16): Home(), ClubFiltersForm(), ClubList(), ClubListEntry(), ClubListItem, ClubFilters, clubsHref(), clubWhere() (+8 more)

### Community 25 - "Community 25"
Cohesion: 0.14
Nodes (18): ClubMap(), ClubMapMarker, ClubMapProps, FIT_PADDING, FitToContainer(), KRAKOW_CENTER, ShowClubPickedInList(), ClubMap() (+10 more)

### Community 26 - "Community 26"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 27 - "Community 27"
Cohesion: 0.15
Nodes (17): daysAhead(), Formatter, krakowHour(), krakowLocalToDate(), krakowParts, toKrakowLocal(), BOOKING_DURATIONS, BOOKING_FIELDS (+9 more)

### Community 28 - "Community 28"
Cohesion: 0.13
Nodes (15): OfferFilters(), ReportActionResult, ReportActionResult, ReportForm(), NativeSelect(), NativeSelectOption(), NativeSelectProps, AnalyticsEvent (+7 more)

### Community 29 - "Community 29"
Cohesion: 0.13
Nodes (15): BookingGroup(), MyBookings(), STATUS_STYLE, BOOKING_CANCEL_WINDOW_HOURS, canCancelBooking(), BookingRow, bookingSelect, getMyBookings() (+7 more)

### Community 30 - "Community 30"
Cohesion: 0.09
Nodes (22): dependencies, @base-ui/react, class-variance-authority, cn, @hookform/resolvers, leaflet, lucide-react, next (+14 more)

### Community 31 - "Community 31"
Cohesion: 0.09
Nodes (22): devDependencies, eslint, eslint-config-next, eslint-config-prettier, husky, lint-staged, @playwright/test, prettier (+14 more)

### Community 32 - "Community 32"
Cohesion: 0.13
Nodes (17): postPlayIntent(), LookingForGamePage(), IntentCard(), IntentFilters(), ErrorText(), Field(), PostIntentForm(), getPlayIntentFeed() (+9 more)

### Community 33 - "Community 33"
Cohesion: 0.22
Nodes (12): IntentCardData, FeedFilters, fields, nextDay(), SearchParams, TimeOfDay, MyOpenOffer, intentInviteParams() (+4 more)

### Community 34 - "Community 34"
Cohesion: 0.12
Nodes (4): docs/PLANNING.md (task plan), Slice H: PWA and notifications, Slice I: security and minimal admin, Slice J: before public launch

### Community 36 - "Community 36"
Cohesion: 0.21
Nodes (16): addDays(), ClubPanelPage(), metadata, AddBlockForm(), requireClubStaff, blockForSlot(), bookingForSlot(), ClubPanelDay (+8 more)

### Community 37 - "Community 37"
Cohesion: 0.19
Nodes (14): updatePlayPreferences(), PlayPreferencesPage(), PlayPreferences, PlayPreferencesForm(), save(), toggled(), TIMES_OF_DAY, DISTRICT_LABELS (+6 more)

### Community 38 - "Community 38"
Cohesion: 0.21
Nodes (12): MyGames(), formatKrakowTimeRange(), formatLabel(), Formatter, LabelT, levelLabel(), offerShareTitle(), placeLabel() (+4 more)

### Community 39 - "Community 39"
Cohesion: 0.18
Nodes (14): getPublicProfile(), computeReliability(), ageOn(), MIN_AGE, PROFILE_FIELDS, ProfileInput, profileSchema(), ProfileValues (+6 more)

### Community 40 - "Community 40"
Cohesion: 0.17
Nodes (9): vitest, en, testTranslator(), t, schema, schema, t, schema (+1 more)

### Community 41 - "Community 41"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 42 - "Community 42"
Cohesion: 0.20
Nodes (13): addBlock(), ClubPanelActionResult, confirmBooking(), declineBooking(), overlapsABooking(), removeBlock(), markCourtBooked(), isExclusionViolation() (+5 more)

### Community 43 - "Community 43"
Cohesion: 0.16
Nodes (12): ActionResult, notificationSettingsSchema, updateNotificationSetting(), NotificationSettingsPage(), NotificationSettings, NotificationSettingsForm(), toggle(), ROW_KEYS (+4 more)

### Community 44 - "Community 44"
Cohesion: 0.18
Nodes (12): CandidateOffer, CandidatePlayer, isEligible(), MAX_CANDIDATES, MIN_RELIABILITY_PERCENT, rankCandidates(), eloDistance(), RankableOffer (+4 more)

### Community 45 - "Community 45"
Cohesion: 0.24
Nodes (10): followClub(), FollowClubResult, unfollowClub(), FollowClubButton(), toggle(), BANNED_PROPERTY_KEYS, captureEvent(), getClient() (+2 more)

### Community 46 - "Community 46"
Cohesion: 0.18
Nodes (14): BLOCKING_BOOKING_STATUSES, BlockingBookingStatus, BookingInput, buildDayGrid(), BuildDayGridInput, buildDayWindows(), canFit(), CourtBlockInput (+6 more)

### Community 47 - "Community 47"
Cohesion: 0.12
Nodes (17): scripts, build, check:i18n-keys, check:i18n-strings, clubs:load, coaches:load, dev, format (+9 more)

### Community 48 - "Community 48"
Cohesion: 0.20
Nodes (16): MEMORY.md (agent working notes), Claude Code Planning Prompt, PLANNING-v1.md (archived), Launch Checklist — MatchFinder Kraków, Session Prompts Overview, Session 01: Audit and Offer, Session 02: Join Flow, Session 03: Chat (+8 more)

### Community 49 - "Community 49"
Cohesion: 0.17
Nodes (7): LanguageSwitcher(), choose(), SiteFooter(), ClubDetails, Formatter, setLocale(), next-intl

### Community 50 - "Community 50"
Cohesion: 0.25
Nodes (10): confirmUnsubscribe(), UnsubscribeResult, UnsubscribePage(), UnsubscribePageProps, UnsubscribeButton(), createUnsubscribeToken(), secret(), sign() (+2 more)

### Community 51 - "Community 51"
Cohesion: 0.17
Nodes (14): EmailTemplateInput, escapeHtml(), renderEmailHtml(), renderEmailText(), appUrl(), BookingRecipient, CATEGORY, claimMessagePushSlot() (+6 more)

### Community 52 - "Community 52"
Cohesion: 0.22
Nodes (4): .agents/MEMORY.md (session memory), docs/MATCHFINDER-PLUS.md, docs/TIER2-FEATURES.md, Slice D: chat (messages, system messages, realtime)

### Community 53 - "Community 53"
Cohesion: 0.22
Nodes (10): PlayerPageProps, ProfileHero(), getMatchHistory(), MatchHistoryEntry, MatchSummary, summarizeMatches(), PublicProfile, reliabilityLabel() (+2 more)

### Community 54 - "Community 54"
Cohesion: 0.23
Nodes (12): BookingGrid(), Formatter, LEGEND_SWATCH, overlapsRange(), T, timeLabel(), DaySlot, SlotStatus (+4 more)

### Community 55 - "Community 55"
Cohesion: 0.19
Nodes (10): Card(), ProfilePage(), SettingsLink(), getMyUpcomingGames(), MyGame, MyGameRole, offerSelect, NOW (+2 more)

### Community 57 - "Community 57"
Cohesion: 0.18
Nodes (10): Hidden offers view / Unhide, leaderboard-filters client form, ClubFiltersForm pattern, HeaderNavLinks() component (nav entry), Hide/unhide an offer (Slice N), Leaderboard v1 (Slice L), MobileNav() component (nav entry), OfferFilters pattern (+2 more)

### Community 58 - "Community 58"
Cohesion: 0.21
Nodes (13): Booking (booking schema entity), Club.bookingMode enum (EXTERNAL_LINK / SPINBUDDY), ClubStaff (booking schema entity), Court (booking schema entity), CourtBlock (booking schema entity), CourtHours (booking schema entity), Session 0 — Epic setup, Session 11 — Decision + data model (K.1-K.5) (+5 more)

### Community 59 - "Community 59"
Cohesion: 0.31
Nodes (6): onRequestError, register(), scrubEvent(), nextConfig, withNextIntl, @sentry/nextjs

### Community 61 - "Community 61"
Cohesion: 0.21
Nodes (5): ClubStaffSession, getCurrentUser(), SessionUser, { getCurrentUser, create }, { getCurrentUser, findUnique, notFound }

### Community 62 - "Community 62"
Cohesion: 0.27
Nodes (10): addDays(), BookPage(), BookPageProps, dateOptions(), hrefWith(), Params, parseDate(), parseDuration() (+2 more)

### Community 63 - "Community 63"
Cohesion: 0.38
Nodes (7): MatchHistory(), krakowLocalPlusDays(), PlayAgainOffer, playAgainParams(), eloChangeLabel(), formatScore(), formatScoreFor()

### Community 64 - "Community 64"
Cohesion: 0.20
Nodes (6): formatCheckedDate(), keyPaths(), main(), Messages, { findUnique, followCount, followFindUnique }, en

### Community 65 - "Community 65"
Cohesion: 0.24
Nodes (8): blockedCounterpartIds(), getBlockedPlayers(), isBlocked(), isBlockedEitherWay(), createdAt, {
  requireOnboardedUser,
  joinFindUnique,
  messageCreate,
  notify,
  checkRateLimit,
  isBlockedEitherWay,
}, upcomingJoin, { findUnique, findFirst, findMany }

### Community 67 - "Community 67"
Cohesion: 0.35
Nodes (8): blockPlayer(), unblockPlayer(), BlockPlayerButton(), toggle(), BlockedPlayersList(), PlayerAvatar(), BlockedPlayer, avatarUrl()

### Community 68 - "Community 68"
Cohesion: 0.24
Nodes (11): Korteo (korteo.pl) multi-sport matchmaking platform, Slice Q: Play again + share button + OG preview, Slice R: personal player blocking, Slice S1: invite a player into an offer (OfferInvite), Slice S2: matched candidates on own offer, Slice T: waitlist for a full offer (OfferWaitlist), Slice U1: play preferences (days/times/districts), Slice U2: 'Want to play' intent (PlayIntent) (+3 more)

### Community 69 - "Community 69"
Cohesion: 0.20
Nodes (10): ADDRESS_MAX, CLUB_SUBMISSION_FIELDS, ClubSubmissionInput, clubSubmissionSchema(), ClubSubmissionValues, emptyToUndefined(), NAME_MAX, NOTES_MAX (+2 more)

### Community 70 - "Community 70"
Cohesion: 0.20
Nodes (10): .agents/decisions.md decisions log, AGENTS.md (single source of truth), CLAUDE.md project instructions, docs/BOOKING-EPIC.md (Slice K), Tier-1 feature prompts doc, pnpm check:i18n-keys / check:i18n-strings, graph.json graph data file, graphify-out/GRAPH_REPORT.md (+2 more)

### Community 71 - "Community 71"
Cohesion: 0.24
Nodes (8): cancelBooking(), requestBooking(), notifyBookingCancelled(), notifyBookingRequested(), PENDING_BOOKING, {
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
}, STARTS_AT, validInput

### Community 72 - "Community 72"
Cohesion: 0.24
Nodes (7): SuggestClubPage(), aria(), ClubSubmissionForm(), ErrorText(), Field(), OfferForm shape pattern, ProfileForm shape pattern

### Community 73 - "Community 73"
Cohesion: 0.24
Nodes (6): SaveAvatarResult, UpdateDiscoverableResult, updateProfile(), EditProfilePage(), SaveProfileResult, { findUnique, update, updateMany, exists, remove, redirect }

### Community 74 - "Community 74"
Cohesion: 0.29
Nodes (9): AddBlockInput, addBlockSchema(), AddBlockValues, CLUB_PANEL_REASON_MAX, declineReasonSchema(), emptyToUndefined(), localDateTime(), reasonSchema() (+1 more)

### Community 75 - "Community 75"
Cohesion: 0.27
Nodes (8): checkFile(), lineOf(), visit(), findTsxFiles(), main(), ROOTS, TEXT_PROP_NAMES, Violation

### Community 77 - "Community 77"
Cohesion: 0.28
Nodes (3): docs/BOOKING-EPIC.md, private schema SECURITY DEFINER function pattern, EU sui generis database right (Directive 96/9/EC)

### Community 78 - "Community 78"
Cohesion: 0.36
Nodes (5): trackPlayTodayEmptyState(), trackPlayTodayResultSelected(), trackPlayTodayViewed(), PlayTodayPage(), MarkPlayTodayEvent()

### Community 79 - "Community 79"
Cohesion: 0.25
Nodes (7): CourtDayGrid, BLOCKING_BOOKING_STATUSES, DayGrid, DayGridCourt, getDayGrid(), CLUB_ROW, { findFirst, findBookings, findBlocks }

### Community 80 - "Community 80"
Cohesion: 0.22
Nodes (7): { createUnsubscribeToken }, NOW, { recordNotification }, { sendEmail }, { sendPush }, SUB, { userFindUnique, pushSubscriptionDelete, offerJoinUpdateMany }

### Community 81 - "Community 81"
Cohesion: 0.25
Nodes (7): submitClub(), blockedRefusal() check, createOffer (reference usage of blockedRefusal), RATE_LIMITS, clubSubmissionFieldErrors(), { requireOnboardedUser, clubSubmissionCreate, checkRateLimit }, valid

### Community 82 - "Community 82"
Cohesion: 0.32
Nodes (5): ActionResult, ErrorText(), FieldErrorLike, GamesRow(), ResultForm()

### Community 83 - "Community 83"
Cohesion: 0.32
Nodes (7): ensureVapidConfigured(), isExpired(), PushPayload, PushSubscriptionKeys, sendPush(), SendPushOutcome, web-push

### Community 84 - "Community 84"
Cohesion: 0.39
Nodes (6): loginSchema(), LoginValues, magicLinkRequestSchema(), ValidationT, emailError(), t

### Community 85 - "Community 85"
Cohesion: 0.33
Nodes (7): Admin club-submissions review queue page, Club submission feature (Slice M), Owner checklist before starting, prisma/load-clubs.ts (clubs:load pipeline), ClubSubmission Prisma model, OfferDismissal Prisma model, RateLimitAction enum (+ CLUB_SUBMISSION)

### Community 86 - "Community 86"
Cohesion: 0.38
Nodes (5): requestToJoin skipDuplicates idiom, dismissOffer(), DismissOfferResult, undismissOffer(), {
  requireOnboardedUser,
  offerFindUnique,
  dismissalCreateMany,
  dismissalDeleteMany,
  revalidatePath,
}

### Community 87 - "Community 87"
Cohesion: 0.48
Nodes (5): AUTOBLOCK_THRESHOLD, AUTOBLOCK_WINDOW_DAYS, maybeAutoblock(), shouldAutoblock(), { reportFindMany, userUpdateMany, adminActionCreate }

### Community 88 - "Community 88"
Cohesion: 0.40
Nodes (5): getClient(), sendEmail(), SendEmailInput, SendEmailOutcome, resend

### Community 89 - "Community 89"
Cohesion: 0.40
Nodes (5): BookingRequestInput, errorsFor(), parse(), t, valid

### Community 90 - "Community 90"
Cohesion: 0.50
Nodes (3): canCancelOffer(), LATER, NOW

### Community 91 - "Community 91"
Cohesion: 0.60
Nodes (3): JoinRefusal, NOW, refusal()

### Community 92 - "Community 92"
Cohesion: 0.40
Nodes (4): input, { reportCreateManyAndReturn, checkRateLimit, maybeAutoblock }, t, tRateLimit

### Community 94 - "Community 94"
Cohesion: 0.67
Nodes (3): HeaderNavLinks(), isActive(), NavLink

### Community 95 - "Community 95"
Cohesion: 0.50
Nodes (4): README stack glossary table, react-leaflet, tailwindcss, typescript

### Community 98 - "Community 98"
Cohesion: 0.67
Nodes (3): app/admin/reports Page, reportClubMessage(), reportMessage() (app/offers/[id]/report-actions.ts)

### Community 99 - "Community 99"
Cohesion: 0.67
Nodes (3): lint-staged, *.{json,css,yaml,yml}, *.{ts,tsx,mts,js,mjs}

## Knowledge Gaps
- **112 isolated node(s):** `Git workflow: one branch/PR per slice group, squash-merge`, `Deferred items table (⏸)`, `Testing instructions: unit tests in lib/, 4 critical e2e flows`, `AGENTS.md`, `TIER1-FEATURES.md` (+107 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 753 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **69 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `Community 40` to `Community 0`, `Community 1`, `Community 2`, `Community 3`, `Community 4`, `Community 5`, `Community 6`, `Community 8`, `Community 9`, `Community 10`, `Community 11`, `Community 12`, `Community 13`, `Community 14`, `Community 16`, `Community 18`, `Community 19`, `Community 20`, `Community 21`, `Community 23`, `Community 24`, `Community 27`, `Community 29`, `Community 33`, `Community 36`, `Community 37`, `Community 38`, `Community 39`, `Community 42`, `Community 43`, `Community 44`, `Community 45`, `Community 46`, `Community 50`, `Community 53`, `Community 54`, `Community 55`, `Community 59`, `Community 61`, `Community 63`, `Community 64`, `Community 65`, `Community 71`, `Community 73`, `Community 79`, `Community 80`, `Community 81`, `Community 84`, `Community 86`, `Community 87`, `Community 89`, `Community 90`, `Community 91`, `Community 92`, `Community 100`, `Community 101`, `Community 107`?**
  _High betweenness centrality (0.172) - this node is a cross-community bridge._
- **What connects `Git workflow: one branch/PR per slice group, squash-merge`, `Deferred items table (⏸)`, `Testing instructions: unit tests in lib/, 4 critical e2e flows` to the rest of the system?**
  _112 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.050616050616050616 - nodes in this community are weakly interconnected._
- **Why does `next-intl` connect `Community 49` to `Community 0`, `Community 2`, `Community 4`, `Community 8`, `Community 9`, `Community 10`, `Community 11`, `Community 12`, `Community 13`, `Community 14`, `Community 15`, `Community 16`, `Community 17`, `Community 18`, `Community 19`, `Community 20`, `Community 21`, `Community 22`, `Community 23`, `Community 24`, `Community 25`, `Community 27`, `Community 28`, `Community 29`, `Community 32`, `Community 33`, `Community 36`, `Community 37`, `Community 38`, `Community 40`, `Community 42`, `Community 43`, `Community 45`, `Community 50`, `Community 51`, `Community 53`, `Community 54`, `Community 55`, `Community 59`, `Community 61`, `Community 62`, `Community 63`, `Community 64`, `Community 67`, `Community 72`, `Community 73`, `Community 78`, `Community 82`, `Community 86`, `Community 95`?**
  _High betweenness centrality (0.145) - this node is a cross-community bridge._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.06918918918918919 - nodes in this community are weakly interconnected._
- **Why does `next` connect `Community 23` to `Community 0`, `Community 2`, `Community 4`, `Community 8`, `Community 9`, `Community 10`, `Community 11`, `Community 12`, `Community 13`, `Community 14`, `Community 15`, `Community 17`, `Community 18`, `Community 19`, `Community 20`, `Community 21`, `Community 22`, `Community 24`, `Community 25`, `Community 29`, `Community 32`, `Community 33`, `Community 36`, `Community 37`, `Community 38`, `Community 42`, `Community 43`, `Community 45`, `Community 49`, `Community 50`, `Community 53`, `Community 54`, `Community 55`, `Community 59`, `Community 61`, `Community 62`, `Community 63`, `Community 67`, `Community 72`, `Community 73`, `Community 78`, `Community 86`, `Community 94`?**
  _High betweenness centrality (0.088) - this node is a cross-community bridge._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.0655367231638418 - nodes in this community are weakly interconnected._