# Graph Report - tennisApp  (2026-11-07)

## Corpus Check
- 74 files · ~202,854 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1924 nodes · 4858 edges · 193 communities (101 shown, 92 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 85 edges (avg confidence: 0.84)
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
- Community 60
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
- Community 103
- Community 104
- Community 105
- Community 106
- Community 107
- Community 108
- Community 109
- Community 110
- Community 113
- Community 115
- Community 116
- Community 161
- Community 162
- Community 163
- Community 164
- Community 166
- Community 168
- Community 169
- Community 170
- Community 171
- Community 172
- Community 173
- Community 174
- Community 177
- Community 178
- Community 179
- Community 180
- Community 181
- Community 182
- Community 183
- Community 184
- Community 185
- Community 186
- Community 187
- Community 189
- Community 190
- Community 191
- Community 192

## God Nodes (most connected - your core abstractions)
1. `next-intl` - 112 edges
2. `vitest` - 110 edges
3. `next` - 92 edges
4. `db` - 63 edges
5. `Button()` - 54 edges
6. `requireOnboardedUser` - 53 edges
7. `react` - 52 edges
8. `zod` - 40 edges
9. `captureEvent()` - 32 edges
10. `buttonVariants` - 30 edges

## Surprising Connections (you probably didn't know these)
- `submitClub()` --references--> `blockedRefusal() check`  [EXTRACTED]
  app/clubs/suggest/actions.ts → docs/TIER1-FEATURES.md
- `Club submission feature (Slice M)` --references--> `submitClub()`  [EXTRACTED]
  docs/TIER1-FEATURES.md → app/clubs/suggest/actions.ts
- `Club submission feature (Slice M)` --references--> `clubSubmissionSchema()`  [EXTRACTED]
  docs/TIER1-FEATURES.md → lib/validation/club-submission.ts
- `Hide/unhide an offer (Slice N)` --references--> `dismissOffer()`  [EXTRACTED]
  docs/TIER1-FEATURES.md → lib/offers/dismissals/actions.ts
- `dismissOffer()` --references--> `requestToJoin skipDuplicates idiom`  [EXTRACTED]
  lib/offers/dismissals/actions.ts → docs/TIER1-FEATURES.md

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

## Communities (193 total, 92 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (35): admin, PNG, admin, created, PNG, signedInClient(), far, near (+27 more)

### Community 1 - "Community 1"
Cohesion: 0.06
Nodes (44): trackCandidatesViewed(), generateMetadata(), OfferPage(), OfferPageProps, PlayerView(), CandidatesSection(), MarkCandidatesViewed(), MarkMeaningfulAction() (+36 more)

### Community 2 - "Community 2"
Cohesion: 0.05
Nodes (36): ClubChatPage(), ClubChatPageProps, generateMetadata(), generateMetadata(), ClubDetails, formatCheckedDate(), Formatter, getClub() (+28 more)

### Community 3 - "Community 3"
Cohesion: 0.11
Nodes (28): EditProfilePage(), AddBlockResult, FieldErrorLike, OfferFilters(), ClubOption, FieldErrorLike, aria(), Field() (+20 more)

### Community 4 - "Community 4"
Cohesion: 0.10
Nodes (36): ActionResult, notificationSettingsSchema, removePushSubscription(), savePushSubscription(), updateNotificationSetting(), NotificationSettingsPage(), NotificationSettings, NotificationSettingsForm() (+28 more)

### Community 5 - "Community 5"
Cohesion: 0.13
Nodes (18): AccountDeletedPage(), ClubPage(), ClubPageProps, ErrorPage(), AdminAction, AdminActionResult, BookingLink(), ExternalLink() (+10 more)

### Community 6 - "Community 6"
Cohesion: 0.11
Nodes (32): acceptJoin(), cancelOffer(), changeJoin(), declineJoin(), markCourtBooked(), requestToJoin(), RequestToJoinResult, SendMessageResult (+24 more)

### Community 7 - "Community 7"
Cohesion: 0.11
Nodes (29): BookingGrid(), Formatter, LEGEND_SWATCH, overlapsRange(), T, timeLabel(), BLOCKING_BOOKING_STATUSES, BlockingBookingStatus (+21 more)

### Community 8 - "Community 8"
Cohesion: 0.09
Nodes (13): signOut(), geistMono, geistSans, RootLayout(), viewport, HeaderNavLinks(), isActive(), NavLink (+5 more)

### Community 9 - "Community 9"
Cohesion: 0.11
Nodes (20): createOffer(), acceptInvite(), declineInvite(), INVITE_SOURCES, InviteChangeResult, InviteResult, inviteToOffer(), db (+12 more)

### Community 10 - "Community 10"
Cohesion: 0.10
Nodes (27): addDays(), BookPage(), BookPageProps, dateOptions(), hrefWith(), Params, parseDate(), parseDuration() (+19 more)

### Community 11 - "Community 11"
Cohesion: 0.12
Nodes (20): RequestBookingResult, followClub(), FollowClubResult, unfollowClub(), FollowClubButton(), toggle(), AnalyticsEvent, EventProperties (+12 more)

### Community 12 - "Community 12"
Cohesion: 0.14
Nodes (21): reportClubMessage(), SendClubMessageResult, reportMessage(), reportOffer(), BlockPlayerResult, reportPlayer(), createReport(), CreateReportResult (+13 more)

### Community 13 - "Community 13"
Cohesion: 0.07
Nodes (28): eslintConfig, engines, node, name, packageManager, private, version, class-variance-authority (+20 more)

### Community 14 - "Community 14"
Cohesion: 0.13
Nodes (12): giveConsent(), ConsentPage(), AuthRequiredError, requireUser(), CURRENT_CONSENT_VERSION, needsConsent(), { update, redirect }, { requireUser, update, redirect, captureEvent } (+4 more)

### Community 15 - "Community 15"
Cohesion: 0.16
Nodes (19): addDays(), ClubPanelPage(), metadata, AddBlockForm(), ClubStaffSession, requireClubStaff, SessionUser, blockForSlot() (+11 more)

### Community 16 - "Community 16"
Cohesion: 0.14
Nodes (22): JoinChangeResult, confirmResult(), disputeResult(), ErrorsT, loadSubmittableJoin(), PendingResult, SettleAction, SettleOutcome (+14 more)

### Community 17 - "Community 17"
Cohesion: 0.18
Nodes (16): Home(), ClubFiltersForm(), ClubList(), ClubListEntry(), ClubListItem, ClubFilters, clubsHref(), clubWhere() (+8 more)

### Community 18 - "Community 18"
Cohesion: 0.14
Nodes (18): ClubMap(), ClubMapMarker, ClubMapProps, FIT_PADDING, FitToContainer(), KRAKOW_CENTER, ShowClubPickedInList(), ClubMap() (+10 more)

### Community 19 - "Community 19"
Cohesion: 0.15
Nodes (18): DAILY_OFFER_PUSH_LIMIT, hasDailyCapacity(), interestedCandidates(), isInterestedIn(), isQuietHours(), NewOfferInfo, NTRP_MATCH_TOLERANCE, OfferPushCandidate (+10 more)

### Community 20 - "Community 20"
Cohesion: 0.16
Nodes (19): sendClubMessage(), sendMessage(), blockPlayer(), unblockPlayer(), BlockPlayerButton(), toggle(), JoinThread(), MessageRow (+11 more)

### Community 21 - "Community 21"
Cohesion: 0.13
Nodes (16): getJoinThread(), ThreadMessage, canWriteToClubThread(), canWriteToThread(), isJoinThreadParticipant(), getBlockedPlayers(), isBlocked(), isBlockedEitherWay() (+8 more)

### Community 22 - "Community 22"
Cohesion: 0.16
Nodes (16): recordOutboundClick(), markNotificationsReadAction(), offerIdSchema, unreadNotificationCount(), track(), getCurrentUser(), countUnreadNotifications(), InboxNotification (+8 more)

### Community 23 - "Community 23"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 24 - "Community 24"
Cohesion: 0.09
Nodes (22): dependencies, @base-ui/react, class-variance-authority, cn, @hookform/resolvers, leaflet, lucide-react, next (+14 more)

### Community 25 - "Community 25"
Cohesion: 0.09
Nodes (22): devDependencies, eslint, eslint-config-next, eslint-config-prettier, husky, lint-staged, @playwright/test, prettier (+14 more)

### Community 26 - "Community 26"
Cohesion: 0.13
Nodes (12): vitest, en, testTranslator(), input, { reportCreateManyAndReturn, checkRateLimit, maybeAutoblock }, t, tRateLimit, NOW (+4 more)

### Community 27 - "Community 27"
Cohesion: 0.18
Nodes (14): addBlock(), ClubPanelActionResult, confirmBooking(), declineBooking(), overlapsABooking(), removeBlock(), BookingGroup(), MyBookings() (+6 more)

### Community 28 - "Community 28"
Cohesion: 0.16
Nodes (13): submitClub(), MemberLayout(), blockedRefusal() check, createOffer (reference usage of blockedRefusal), requestToJoin skipDuplicates idiom, requireOnboardedUser, dismissOffer(), DismissOfferResult (+5 more)

### Community 29 - "Community 29"
Cohesion: 0.18
Nodes (14): NotificationsPage(), MarkNotificationsRead(), NOTIFICATIONS_CHANGED_EVENT, listNotifications(), formatLabel(), Formatter, LabelT, levelLabel() (+6 more)

### Community 30 - "Community 30"
Cohesion: 0.23
Nodes (14): LanguageSwitcher(), choose(), MESSAGES, setLocale(), AppLocale, DEFAULT_LOCALE, isAppLocale(), LOCALE_COOKIE (+6 more)

### Community 31 - "Community 31"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 32 - "Community 32"
Cohesion: 0.25
Nodes (13): AdminActionResult, annulDisputedResult(), blockFromReport(), confirmDisputedResult(), dismissReport(), hideReport(), logAction(), unblockPlayer() (+5 more)

### Community 33 - "Community 33"
Cohesion: 0.22
Nodes (13): GET(), autoDeclinePendingBookings(), expirePendingInvites(), krakowTimeRangeLabel(), ReminderCounts, runNotificationReminders(), sendHowDidItGoPrompts(), sendMatchReminders() (+5 more)

### Community 34 - "Community 34"
Cohesion: 0.19
Nodes (11): SaveAvatarResult, UpdateDiscoverableResult, updateProfile(), completeOnboarding(), OnboardingPage(), STARTING_ELO, startingElo(), profileFieldErrors() (+3 more)

### Community 35 - "Community 35"
Cohesion: 0.15
Nodes (12): BOOKING_CANCEL_WINDOW_HOURS, canCancelBooking(), BookingRow, bookingSelect, getMyBookings(), MyBooking, toMyBooking(), JUST_INSIDE_WINDOW (+4 more)

### Community 36 - "Community 36"
Cohesion: 0.20
Nodes (16): MEMORY.md (agent working notes), Claude Code Planning Prompt, PLANNING-v1.md (archived), Launch Checklist — MatchFinder Kraków, Session Prompts Overview, Session 01: Audit and Offer, Session 02: Join Flow, Session 03: Chat (+8 more)

### Community 37 - "Community 37"
Cohesion: 0.23
Nodes (13): AdminReportsPage(), metadata, AdminResultsPage(), metadata, AdminActionForm(), BlockedPlayer, DisputedResult, getBlockedPlayers() (+5 more)

### Community 38 - "Community 38"
Cohesion: 0.28
Nodes (13): saveAvatar(), ACCEPT, AvatarUpload(), choose(), reset(), save(), AVATAR_BUCKET, AVATAR_MAX_BYTES (+5 more)

### Community 39 - "Community 39"
Cohesion: 0.23
Nodes (8): exportMyData(), ExportDataPage(), ExportDataButton(), download(), exportUserData(), UserDataExport, firstNameAndInitial(), {
  userFindUniqueOrThrow,
  offerFindMany,
  joinFindMany,
  messageFindMany,
  matchResultFindMany,
  clubFollowFindMany,
}

### Community 40 - "Community 40"
Cohesion: 0.25
Nodes (10): confirmUnsubscribe(), UnsubscribeResult, UnsubscribePage(), UnsubscribePageProps, UnsubscribeButton(), createUnsubscribeToken(), secret(), sign() (+2 more)

### Community 41 - "Community 41"
Cohesion: 0.18
Nodes (11): NTRP_MIN/MAX/STEP constants, getLeaderboard(), LEADERBOARD_SIZE, LeaderboardRow, leaderboardSelect, toLeaderboardPlayer(), getPublicProfile(), computeReliability() (+3 more)

### Community 42 - "Community 42"
Cohesion: 0.16
Nodes (11): InviteAction, OfferState, TRANSITIONS, playersNeeded(), doubles, doublesWithPartner, LATER, NOW (+3 more)

### Community 43 - "Community 43"
Cohesion: 0.12
Nodes (16): scripts, build, check:i18n-keys, check:i18n-strings, clubs:load, dev, format, format:check (+8 more)

### Community 44 - "Community 44"
Cohesion: 0.17
Nodes (4): ClubSubmission model, SpinBuddy project summary, Slice D: chat (messages, system messages, realtime), Message Model

### Community 45 - "Community 45"
Cohesion: 0.24
Nodes (9): LeaderboardPage(), PlayerPage(), PlayerPageProps, InvitePlayerButton(), LeaderboardRow(), PlayerLink-style pattern, LeaderboardPlayer, getMyOpenOffers() (+1 more)

### Community 46 - "Community 46"
Cohesion: 0.23
Nodes (9): MobileNav(), NavLink, Sheet(), SheetContent(), SheetOverlay(), SheetPortal(), SheetTitle(), SheetTrigger() (+1 more)

### Community 47 - "Community 47"
Cohesion: 0.18
Nodes (12): EmailTemplateInput, escapeHtml(), renderEmailHtml(), renderEmailText(), appUrl(), BookingRecipient, CATEGORY, claimMessagePushSlot() (+4 more)

### Community 48 - "Community 48"
Cohesion: 0.19
Nodes (13): DEFAULT_OFFER_DURATION, COMMENT_MAX, CreateOfferResult, emptyToUndefined(), OFFER_FIELDS, OfferInput, offerSchema(), OfferValues (+5 more)

### Community 49 - "Community 49"
Cohesion: 0.14
Nodes (6): OfferInvite model, OfferJoin model, Slice A: sync plan with code, lighten process, Slice B: finish the offer (age 18, court status), Slice C: request and acceptance (main loop), Slice G: courts and external booking links

### Community 50 - "Community 50"
Cohesion: 0.18
Nodes (12): UserBlock model, Korteo (korteo.pl) multi-sport matchmaking platform, Slice Q: Play again + share button + OG preview, Slice R: personal player blocking, Slice S1: invite a player into an offer (OfferInvite), Slice S2: matched candidates on own offer, Slice T: waitlist for a full offer (OfferWaitlist), Slice U1: play preferences (days/times/districts) (+4 more)

### Community 51 - "Community 51"
Cohesion: 0.23
Nodes (10): updateDiscoverable(), Card(), ProfilePage(), SettingsLink(), DiscoverableToggle(), getMatchHistory(), MatchHistoryEntry, summarizeMatches() (+2 more)

### Community 52 - "Community 52"
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

### Community 53 - "Community 53"
Cohesion: 0.25
Nodes (7): applyMatchElo(), applyMatchEloFromJoin(), PendingResultJoin, computeEloChange(), expectedScore(), kFactor(), MatchOutcome

### Community 54 - "Community 54"
Cohesion: 0.22
Nodes (11): ageOn(), MIN_AGE, PROFILE_FIELDS, ProfileInput, profileSchema(), ProfileValues, todayInKrakow(), ValidationT (+3 more)

### Community 55 - "Community 55"
Cohesion: 0.22
Nodes (9): postSystemMessage(), RESULT_AUTO_CONFIRMED_MESSAGE, ThreadRef, SYSTEM_MESSAGE_KEYS, SystemMessageKey, { messageCreate }, { matchResultFindMany, postSystemMessage, tx }, pendingNoShowReport (+1 more)

### Community 56 - "Community 56"
Cohesion: 0.26
Nodes (8): GET(), CallbackParams, otpTypeSchema, parseCallbackParams(), ensureUserRow(), createSupabaseServerClient(), parse(), { upsert }

### Community 57 - "Community 57"
Cohesion: 0.22
Nodes (9): SendMagicLinkResult, loginSchema(), LoginValues, magicLinkRequestSchema(), ValidationT, { headersGet, signInWithOtp, checkRateLimit }, valid, emailError() (+1 more)

### Community 58 - "Community 58"
Cohesion: 0.26
Nodes (7): GoogleSignInButton(), signIn(), createSupabaseBrowserClient(), supabaseEnv(), @supabase/ssr, jar, session

### Community 59 - "Community 59"
Cohesion: 0.21
Nodes (13): Booking (booking schema entity), Club.bookingMode enum (EXTERNAL_LINK / SPINBUDDY), ClubStaff (booking schema entity), Court (booking schema entity), CourtBlock (booking schema entity), CourtHours (booking schema entity), Session 0 — Epic setup, Session 11 — Decision + data model (K.1-K.5) (+5 more)

### Community 60 - "Community 60"
Cohesion: 0.31
Nodes (6): onRequestError, register(), scrubEvent(), nextConfig, withNextIntl, @sentry/nextjs

### Community 61 - "Community 61"
Cohesion: 0.24
Nodes (10): blockedCounterpartIds(), FEED_PAGE_SIZE, FeedOffer, feedOfferSelect, FeedPage, getClubOffers(), getOfferFeed(), toFeedOffer() (+2 more)

### Community 62 - "Community 62"
Cohesion: 0.17
Nodes (5): AdminAction model, RateLimitCounter model, Report model, AGENTS.md approved tech stack list, Slice I: security and minimal admin

### Community 63 - "Community 63"
Cohesion: 0.24
Nodes (9): AdminActionResult, approveSubmission(), rejectSubmission(), AdminClubSubmissionsPage(), metadata, New NotificationKind value (submitter decision notice), notify()/sendEmail() pattern, getOpenClubSubmissions() (+1 more)

### Community 64 - "Community 64"
Cohesion: 0.27
Nodes (8): sendMagicLink(), LoginPage(), LoginPageProps, LoginForm(), onSubmit(), isPublicRoute(), PUBLIC_ROUTES, safeNextPath()

### Community 65 - "Community 65"
Cohesion: 0.18
Nodes (11): LeaderboardFiltersForm(), Coaches Query Zod Schema, fields, first(), LeaderboardFilters, leaderboardHref(), NTRP_BAND_KEYS, NTRP_BANDS (+3 more)

### Community 66 - "Community 66"
Cohesion: 0.38
Nodes (7): MatchHistory(), krakowLocalPlusDays(), PlayAgainOffer, playAgainParams(), eloChangeLabel(), formatScore(), formatScoreFor()

### Community 67 - "Community 67"
Cohesion: 0.21
Nodes (10): FeedFilters, feedWhere(), fields, matchesTimeOfDay(), nextDay(), SearchParams, TimeOfDay, TIMES_OF_DAY (+2 more)

### Community 68 - "Community 68"
Cohesion: 0.24
Nodes (10): Admin club-submissions review queue page, Hidden offers view / Unhide, Club submission feature (Slice M), Hide/unhide an offer (Slice N), Owner checklist before starting, Shared session preamble, prisma/load-clubs.ts (clubs:load pipeline), ClubSubmission Prisma model (+2 more)

### Community 69 - "Community 69"
Cohesion: 0.24
Nodes (9): cancelBooking(), requestBooking(), notifyBookingCancelled(), notifyBookingRequested(), sendBookingNotification(), PENDING_BOOKING, {
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
}, STARTS_AT (+1 more)

### Community 70 - "Community 70"
Cohesion: 0.29
Nodes (8): BlockedPlayersList(), PlayerAvatar(), ProfileHero(), BlockedPlayer, MatchSummary, PublicProfile, avatarUrl(), reliabilityLabel()

### Community 71 - "Community 71"
Cohesion: 0.20
Nodes (10): ADDRESS_MAX, CLUB_SUBMISSION_FIELDS, ClubSubmissionInput, clubSubmissionSchema(), ClubSubmissionValues, emptyToUndefined(), NAME_MAX, NOTES_MAX (+2 more)

### Community 72 - "Community 72"
Cohesion: 0.24
Nodes (10): gamesSchema(), isValidRegularSet(), isValidSet(), isValidSuperTiebreak(), MatchScoreInput, MatchScoreValues, SetOutcome, SetScore (+2 more)

### Community 73 - "Community 73"
Cohesion: 0.31
Nodes (3): MatchResult model, Slice E: match result and ELO, Slice F: player reliability (no-show, late cancellation)

### Community 74 - "Community 74"
Cohesion: 0.20
Nodes (10): .agents/decisions.md decisions log, AGENTS.md (single source of truth), CLAUDE.md project instructions, docs/BOOKING-EPIC.md (Slice K), Tier-1 feature prompts doc, pnpm check:i18n-keys / check:i18n-strings, graph.json graph data file, graphify-out/GRAPH_REPORT.md (+2 more)

### Community 75 - "Community 75"
Cohesion: 0.24
Nodes (7): SuggestClubPage(), aria(), ClubSubmissionForm(), ErrorText(), Field(), OfferForm shape pattern, ProfileForm shape pattern

### Community 76 - "Community 76"
Cohesion: 0.22
Nodes (7): getMyUpcomingGames(), MyGame, MyGameRole, offerSelect, NOW, offer(), { offerFindMany, joinFindMany }

### Community 77 - "Community 77"
Cohesion: 0.24
Nodes (6): settleResultRefusal, submitResultRefusal, FUTURE, join, NOW, PAST

### Community 78 - "Community 78"
Cohesion: 0.29
Nodes (9): AddBlockInput, addBlockSchema(), AddBlockValues, CLUB_PANEL_REASON_MAX, declineReasonSchema(), emptyToUndefined(), localDateTime(), reasonSchema() (+1 more)

### Community 79 - "Community 79"
Cohesion: 0.27
Nodes (8): checkFile(), lineOf(), visit(), findTsxFiles(), main(), ROOTS, TEXT_PROP_NAMES, Violation

### Community 80 - "Community 80"
Cohesion: 0.22
Nodes (7): leaderboard-filters client form, ClubFiltersForm pattern, HeaderNavLinks() component (nav entry), Leaderboard v1 (Slice L), MobileNav() component (nav entry), OfferFilters pattern, leaderboardQuerySchema (Zod)

### Community 81 - "Community 81"
Cohesion: 0.25
Nodes (8): blockedRefusal(), FollowClubButton Component, followClub(), requestToJoin() skipDuplicates Idiom (N.4), requireOnboardedUser(), sendClubMessage(), sendMessage() (app/offers/[id]/actions.ts), unfollowClub()

### Community 82 - "Community 82"
Cohesion: 0.22
Nodes (9): ClubFollow Model, export-user-data.ts (GDPR export), firstNameAndInitial() (lib/privacy/opponent-name.ts), getClub() (lib/clubs/club-details.ts), getClubThread(), is_message_thread_participant() SECURITY DEFINER Function, "messages: thread participants can read" RLS Policy, offer_dismissals RLS-No-Policy Pattern (+1 more)

### Community 83 - "Community 83"
Cohesion: 0.42
Nodes (7): daysAhead(), formatKrakowTimeRange(), Formatter, krakowHour(), krakowLocalToDate(), krakowParts, toKrakowLocal()

### Community 84 - "Community 84"
Cohesion: 0.22
Nodes (7): { createUnsubscribeToken }, NOW, { recordNotification }, { sendEmail }, { sendPush }, SUB, { userFindUnique, pushSubscriptionDelete, offerJoinUpdateMany }

### Community 86 - "Community 86"
Cohesion: 0.39
Nodes (5): OffersPage(), OfferCard(), feedHref(), parseFeedFilters(), parsePage()

### Community 87 - "Community 87"
Cohesion: 0.32
Nodes (5): ActionResult, ErrorText(), FieldErrorLike, GamesRow(), ResultForm()

### Community 88 - "Community 88"
Cohesion: 0.36
Nodes (6): Club Chat Feature, .agents/decisions.md, notify() Function, Session O1: Follow a Club, Session O2: Club Chat (Message.clubId + RLS), Slice O

### Community 89 - "Community 89"
Cohesion: 0.32
Nodes (7): ensureVapidConfigured(), isExpired(), PushPayload, PushSubscriptionKeys, sendPush(), SendPushOutcome, web-push

### Community 91 - "Community 91"
Cohesion: 0.38
Nodes (6): NewOfferPage(), aria(), ErrorText(), Field(), NtrpSelect(), OfferForm()

### Community 92 - "Community 92"
Cohesion: 0.29
Nodes (7): ClubFiltersForm Component, CoachCard Component, CoachFilters Component, app/coaches/page.tsx, ExternalLink Component, getCoaches(), leaderboard-filters Component

### Community 93 - "Community 93"
Cohesion: 0.48
Nodes (5): AUTOBLOCK_THRESHOLD, AUTOBLOCK_WINDOW_DAYS, maybeAutoblock(), shouldAutoblock(), { reportFindMany, userUpdateMany, adminActionCreate }

### Community 94 - "Community 94"
Cohesion: 0.33
Nodes (3): Club Model, Message.clubId Field, messages_one_thread_check Constraint

### Community 96 - "Community 96"
Cohesion: 0.47
Nodes (4): Coaching Directory Feature, Session P1: Coach Data Model + Load Pipeline, Session P2: Coaching Directory Page, Slice P

### Community 97 - "Community 97"
Cohesion: 0.33
Nodes (6): Coach Model, Coach Zod Schema (lib/validation/coach.ts), prisma/data/coaches.json, CoachLevel Enum, upsertCoaches(), upsert-clubs.ts / load-clubs.ts

### Community 98 - "Community 98"
Cohesion: 0.40
Nodes (5): getClient(), sendEmail(), SendEmailInput, SendEmailOutcome, resend

### Community 101 - "Community 101"
Cohesion: 0.60
Nodes (3): isOfferDuration(), OfferDuration, offerEndsAt()

### Community 102 - "Community 102"
Cohesion: 0.50
Nodes (3): getDayGrid(), CLUB_ROW, { findFirst, findBookings, findBlocks }

### Community 104 - "Community 104"
Cohesion: 0.50
Nodes (4): README stack glossary table, react-leaflet, tailwindcss, typescript

### Community 108 - "Community 108"
Cohesion: 0.67
Nodes (3): app/admin/reports Page, reportClubMessage(), reportMessage() (app/offers/[id]/report-actions.ts)

### Community 109 - "Community 109"
Cohesion: 0.67
Nodes (3): lint-staged, *.{json,css,yaml,yml}, *.{ts,tsx,mts,js,mjs}

## Knowledge Gaps
- **113 isolated node(s):** `husky`, `lint-staged`, `prettier`, `@prisma/client`, `react-dom` (+108 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 744 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **92 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `Community 26` to `Community 1`, `Community 2`, `Community 3`, `Community 4`, `Community 5`, `Community 6`, `Community 7`, `Community 8`, `Community 9`, `Community 10`, `Community 11`, `Community 12`, `Community 13`, `Community 14`, `Community 15`, `Community 16`, `Community 17`, `Community 19`, `Community 21`, `Community 22`, `Community 27`, `Community 28`, `Community 29`, `Community 32`, `Community 33`, `Community 34`, `Community 35`, `Community 38`, `Community 39`, `Community 40`, `Community 41`, `Community 42`, `Community 48`, `Community 51`, `Community 52`, `Community 53`, `Community 54`, `Community 55`, `Community 56`, `Community 57`, `Community 58`, `Community 60`, `Community 61`, `Community 63`, `Community 64`, `Community 66`, `Community 67`, `Community 69`, `Community 76`, `Community 77`, `Community 83`, `Community 84`, `Community 93`, `Community 100`, `Community 101`, `Community 102`, `Community 103`?**
  _High betweenness centrality (0.181) - this node is a cross-community bridge._
- **What connects `husky`, `lint-staged`, `prettier` to the rest of the system?**
  _113 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.07404426559356136 - nodes in this community are weakly interconnected._
- **Why does `next-intl` connect `Community 5` to `Community 1`, `Community 2`, `Community 3`, `Community 4`, `Community 6`, `Community 7`, `Community 8`, `Community 9`, `Community 10`, `Community 11`, `Community 12`, `Community 13`, `Community 14`, `Community 15`, `Community 16`, `Community 17`, `Community 18`, `Community 20`, `Community 26`, `Community 27`, `Community 28`, `Community 29`, `Community 30`, `Community 34`, `Community 37`, `Community 38`, `Community 39`, `Community 40`, `Community 45`, `Community 46`, `Community 47`, `Community 51`, `Community 52`, `Community 57`, `Community 60`, `Community 63`, `Community 64`, `Community 66`, `Community 70`, `Community 75`, `Community 83`, `Community 86`, `Community 87`, `Community 104`?**
  _High betweenness centrality (0.131) - this node is a cross-community bridge._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.058823529411764705 - nodes in this community are weakly interconnected._
- **Why does `Coach Zod Schema (lib/validation/coach.ts)` connect `Community 97` to `Community 2`?**
  _High betweenness centrality (0.120) - this node is a cross-community bridge._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.050816696914700546 - nodes in this community are weakly interconnected._