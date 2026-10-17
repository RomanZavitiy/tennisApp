# Graph Report - tennisApp  (2026-10-17)

## Corpus Check
- 351 files · ~146,008 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 10 file(s) not represented in the graph (top: (none) 5, .example 1, .ico 1)

## Summary
- 1368 nodes · 3573 edges · 99 communities (61 shown, 38 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 71 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `62bae51f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- vitest
- supabase-admin.ts
- next
- zod
- result-actions.ts
- profile/page.tsx
- clubs/[id]/page.tsx
- club-map.tsx
- offers/[id]/actions.ts
- package.json
- club.ts
- feed.ts
- requireOnboardedUser
- next-intl
- my-games.tsx
- components.json
- dependencies
- devDependencies
- getCurrentUser
- lib_generated_prisma_enums
- join-transitions.ts
- offer-interest.ts
- PLANNING.md (v2)
- avatar-upload.tsx
- report-actions.ts
- db.ts
- compilerOptions
- offer-form.tsx
- app/layout.tsx
- AGENTS.md
- Direct Migration Apply, Bypassing Prisma Shadow DB
- createSupabaseServerClient
- buttonVariants
- options.ts
- notify
- notify.ts
- scripts
- offers/[id]/page.tsx
- reliability.ts
- captureEvent
- require-user.ts
- offer.ts
- Session 04: Results and ELO
- create-report.test.ts
- new/actions.ts
- delete/actions.ts
- thread-data.ts
- offer-card.tsx
- krakow-time.ts
- result-form.tsx
- @sentry/nextjs
- offer-details.ts
- profile/actions.ts
- export-user-data.ts
- auto-confirm.ts
- post-system-message.ts
- clubs-view.tsx
- Session 09: Polish i18n and Profile Photo
- translator.ts
- elo-rank.ts
- Session 08: Safety and Admin
- new-offer.test.ts
- lint-staged
- vercel.json
- engines
- postcss.config.mjs
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

## God Nodes (most connected - your core abstractions)
1. `vitest` - 84 edges
2. `next-intl` - 80 edges
3. `next` - 70 edges
4. `Button()` - 44 edges
5. `db` - 42 edges
6. `react` - 41 edges
7. `requireOnboardedUser` - 40 edges
8. `buttonVariants` - 32 edges
9. `getCurrentUser()` - 26 edges
10. `zod` - 26 edges

## Surprising Connections (you probably didn't know these)
- `generateMetadata()` --calls--> `getPublicProfile()`  [EXTRACTED]
  app/players/[id]/page.tsx → lib/players/public-profile.ts
- `refusal()` --calls--> `joinChangeRefusal`  [EXTRACTED]
  tests/lib/offers/join-transitions.test.ts → lib/offers/join-transitions.ts
- `Slice = Branch = PR Workflow` --conceptually_related_to--> `Slice A — Sync and Process Lightening`  [INFERRED]
  AGENTS.md → docs/PLANNING.md
- `Claude Code Planning Prompt` --references--> `PLANNING-v1.md (archived)`  [INFERRED]
  claude-code-planning-prompt.md → docs/archive/PLANNING-v1.md
- `Stop-and-Ask Conditions` --conceptually_related_to--> `Account Deletion: Owner-Run Manual Process (superseded same day)`  [INFERRED]
  AGENTS.md → .agents/decisions.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Migrations Applied Around the Broken Prisma Shadow DB** — _agents_decisions_shadow_db_migration_workaround, _agents_decisions_court_status_field, _agents_decisions_system_messages_type, _agents_decisions_matchresult_model, _agents_decisions_no_show_handling, _agents_decisions_reliability_counters, _agents_decisions_notifications_schema_user_email, _agents_decisions_reports_admin_schema, _agents_decisions_polish_i18n_nextintl, _agents_decisions_legal_draft_pages [EXTRACTED 1.00]
- **Slice-Based Session Workflow** — agents_slice_workflow, docs_planning, docs_prompts_00_readme, docs_prompts_01_session_audit_and_offer, docs_prompts_02_session_join_flow, docs_prompts_03_session_chat, docs_prompts_04_session_results_and_elo, docs_prompts_05_session_reliability, docs_prompts_06_session_courts_and_booking, docs_prompts_07_session_pwa_and_notifications, docs_prompts_08_session_safety_and_admin, docs_prompts_09_session_polish_and_profile_photo, docs_prompts_10_session_launch_readiness [EXTRACTED 1.00]
- **ELO Rating Subsystem** — _agents_decisions_starting_elo_ntrp, _agents_decisions_elo_field_user, _agents_decisions_elo_formula, _agents_decisions_feed_elo_ranking, _agents_decisions_feed_ranking_wired, _agents_decisions_matchresult_model, _agents_decisions_result_confirmation [INFERRED 0.85]

## Communities (99 total, 38 thin omitted)

### Community 0 - "vitest"
Cohesion: 0.16
Nodes (6): CURRENT_CONSENT_VERSION, needsConsent(), vitest, { update, redirect }, complete, { findUnique, redirect }

### Community 1 - "supabase-admin.ts"
Cohesion: 0.08
Nodes (32): admin, PNG, admin, created, PNG, signedInClient(), far, near (+24 more)

### Community 2 - "next"
Cohesion: 0.09
Nodes (26): AdminActionResult, annulDisputedResult(), blockFromReport(), confirmDisputedResult(), dismissReport(), hideReport(), logAction(), unblockPlayer() (+18 more)

### Community 3 - "zod"
Cohesion: 0.12
Nodes (30): ActionResult, notificationSettingsSchema, removePushSubscription(), savePushSubscription(), initialStatus(), PushSubscribeControl(), disable(), enable() (+22 more)

### Community 4 - "result-actions.ts"
Cohesion: 0.11
Nodes (26): JoinChangeResult, confirmResult(), disputeResult(), ErrorsT, loadSubmittableJoin(), PendingResult, SettleAction, SettleOutcome (+18 more)

### Community 5 - "profile/page.tsx"
Cohesion: 0.07
Nodes (38): Card(), ProfilePage(), SettingsLink(), generateMetadata(), PlayerPage(), PlayerPageProps, MatchHistory(), MyGames() (+30 more)

### Community 6 - "clubs/[id]/page.tsx"
Cohesion: 0.10
Nodes (19): recordOutboundClick(), ClubPage(), ClubPageProps, generateMetadata(), BookingLink(), track(), ExternalLink(), ClubDetails (+11 more)

### Community 7 - "club-map.tsx"
Cohesion: 0.19
Nodes (13): ClubMap(), ClubMapMarker, ClubMapProps, FIT_PADDING, FitToContainer(), KRAKOW_CENTER, ShowClubPickedInList(), ClubMap() (+5 more)

### Community 8 - "offers/[id]/actions.ts"
Cohesion: 0.14
Nodes (23): acceptJoin(), cancelOffer(), changeJoin(), declineJoin(), markCourtBooked(), requestToJoin(), RequestToJoinResult, sendMessage() (+15 more)

### Community 9 - "package.json"
Cohesion: 0.08
Nodes (25): eslintConfig, name, packageManager, private, version, class-variance-authority, eslint, eslint-config-next (+17 more)

### Community 10 - "club.ts"
Cohesion: 0.10
Nodes (18): ClubRecord, clubSchema, describe(), httpUrl, KRAKOW_BOUNDS, parseClubFile(), main(), prisma (+10 more)

### Community 11 - "feed.ts"
Cohesion: 0.12
Nodes (24): OffersPage(), OfferDuration, FEED_PAGE_SIZE, FeedOffer, feedOfferSelect, FeedPage, FeedFilters, feedHref() (+16 more)

### Community 12 - "requireOnboardedUser"
Cohesion: 0.33
Nodes (4): MemberLayout(), EditProfilePage(), ExportDataPage(), requireOnboardedUser

### Community 13 - "next-intl"
Cohesion: 0.14
Nodes (21): DeleteAccountPage(), AdminAction, AdminActionForm(), AdminActionResult, GoogleSignInButton(), signIn(), MessageRow, MessageThread() (+13 more)

### Community 14 - "my-games.tsx"
Cohesion: 0.18
Nodes (9): updateNotificationSetting(), NotificationSettingsPage(), NotificationSettings, NotificationSettingsForm(), toggle(), ROW_KEYS, Switch(), @base-ui/react (+1 more)

### Community 15 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 16 - "dependencies"
Cohesion: 0.09
Nodes (22): dependencies, @base-ui/react, class-variance-authority, cn, @hookform/resolvers, leaflet, lucide-react, next (+14 more)

### Community 17 - "devDependencies"
Cohesion: 0.09
Nodes (22): devDependencies, eslint, eslint-config-next, eslint-config-prettier, husky, lint-staged, @playwright/test, prettier (+14 more)

### Community 18 - "getCurrentUser"
Cohesion: 0.08
Nodes (34): signOut(), markNotificationsReadAction(), offerIdSchema, unreadNotificationCount(), NotificationsPage(), HeaderNavLinks(), isActive(), NavLink (+26 more)

### Community 19 - "lib_generated_prisma_enums"
Cohesion: 0.17
Nodes (6): canCancelOffer(), joinRefusal, LATER, NOW, NOW, refusal()

### Community 20 - "join-transitions.ts"
Cohesion: 0.18
Nodes (12): ACTION_ACTOR, JoinAction, OfferState, offerStatusFor(), TRANSITIONS, doubles, doublesWithPartner, LATER (+4 more)

### Community 21 - "offer-interest.ts"
Cohesion: 0.19
Nodes (16): DAILY_OFFER_PUSH_LIMIT, hasDailyCapacity(), interestedCandidates(), isInterestedIn(), isQuietHours(), levelMatches(), NewOfferInfo, NTRP_MATCH_TOLERANCE (+8 more)

### Community 22 - "PLANNING.md (v2)"
Cohesion: 0.18
Nodes (17): decisions.md (architecture decision log), MEMORY.md (agent working notes), Two-Strikes Rule, PLANNING-v1.md (archived), PLANNING.md (v2), Slice A — Sync and Process Lightening, Slice B — Finish the Offer, Slice C — Join and Accept (+9 more)

### Community 23 - "avatar-upload.tsx"
Cohesion: 0.28
Nodes (13): saveAvatar(), ACCEPT, AvatarUpload(), choose(), reset(), save(), AVATAR_BUCKET, AVATAR_MAX_BYTES (+5 more)

### Community 24 - "report-actions.ts"
Cohesion: 0.22
Nodes (13): reportMessage(), reportOffer(), reportPlayer(), createReport(), CreateReportResult, emptyToUndefined(), REPORT_COMMENT_MAX, ReportInput (+5 more)

### Community 25 - "db.ts"
Cohesion: 0.17
Nodes (7): db, globalForPrisma, ErrorsT, RATE_LIMITS, RateLimitResult, @prisma/adapter-pg, { upsert }

### Community 26 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 27 - "offer-form.tsx"
Cohesion: 0.19
Nodes (19): OfferFilters(), aria(), ClubOption, ErrorText(), Field(), FieldErrorLike, NtrpSelect(), OfferForm() (+11 more)

### Community 28 - "app/layout.tsx"
Cohesion: 0.06
Nodes (41): GET(), geistMono, geistSans, RootLayout(), viewport, sendMagicLink(), SendMagicLinkResult, LanguageSwitcher() (+33 more)

### Community 29 - "AGENTS.md"
Cohesion: 0.18
Nodes (5): Change-Size Discipline, Slice = Branch = PR Workflow, Stop-and-Ask Conditions, Claude Code Planning Prompt, Session 10: Launch Readiness

### Community 31 - "createSupabaseServerClient"
Cohesion: 0.33
Nodes (5): supabaseEnv(), createSupabaseServerClient(), @supabase/ssr, jar, session

### Community 32 - "buttonVariants"
Cohesion: 0.15
Nodes (18): AccountDeletedPage(), Home(), ClubFiltersForm(), ClubList(), ClubListEntry(), ClubListItem, buttonVariants, ClubFilters (+10 more)

### Community 33 - "options.ts"
Cohesion: 0.13
Nodes (18): getPublicProfile(), NTRP_LEVELS, NTRP_MAX, NTRP_MIN, NTRP_STEP, ageOn(), MIN_AGE, PROFILE_FIELDS (+10 more)

### Community 34 - "notify"
Cohesion: 0.42
Nodes (8): notify(), ReminderCounts, runNotificationReminders(), sendHowDidItGoPrompts(), sendMatchReminders(), sendResultConfirmationReminders(), NOW, { offerFindMany, offerUpdate, resultFindMany, resultUpdate, notify }

### Community 35 - "notify.ts"
Cohesion: 0.06
Nodes (39): confirmUnsubscribe(), UnsubscribeResult, UnsubscribePage(), UnsubscribePageProps, UnsubscribeButton(), getClient(), sendEmail(), SendEmailInput (+31 more)

### Community 36 - "scripts"
Cohesion: 0.13
Nodes (15): scripts, build, check:i18n-keys, check:i18n-strings, clubs:load, dev, format, format:check (+7 more)

### Community 37 - "offers/[id]/page.tsx"
Cohesion: 0.24
Nodes (12): AuthorView(), OfferPage(), OfferPageProps, PlayerLink(), PlayerView(), ResultSection(), JoinThread(), MarkMeaningfulAction() (+4 more)

### Community 38 - "reliability.ts"
Cohesion: 0.16
Nodes (11): applyMatchElo(), applyMatchEloFromJoin(), PendingResultJoin, computeEloChange(), expectedScore(), kFactor(), MatchOutcome, recordScheduledMatch() (+3 more)

### Community 39 - "captureEvent"
Cohesion: 0.22
Nodes (10): AnalyticsEvent, EventProperties, OfferFormat, OutboundTarget, PropertiesFor, BANNED_PROPERTY_KEYS, captureEvent(), getClient() (+2 more)

### Community 40 - "require-user.ts"
Cohesion: 0.21
Nodes (8): giveConsent(), ConsentPage(), OnboardingPage(), AuthRequiredError, requireUser(), { requireUser, update, redirect, captureEvent }, valid, getClaims

### Community 41 - "offer.ts"
Cohesion: 0.16
Nodes (15): DEFAULT_OFFER_DURATION, isOfferDuration(), offerEndsAt(), COMMENT_MAX, CreateOfferResult, emptyToUndefined(), OFFER_FIELDS, OfferInput (+7 more)

### Community 43 - "Session 04: Results and ELO"
Cohesion: 0.20
Nodes (3): Notification Reminders workflow, Slice E — Result and ELO, Session 04: Results and ELO

### Community 44 - "create-report.test.ts"
Cohesion: 0.23
Nodes (9): AUTOBLOCK_THRESHOLD, AUTOBLOCK_WINDOW_DAYS, maybeAutoblock(), shouldAutoblock(), { reportFindMany, userUpdateMany, adminActionCreate }, input, { reportCreateManyAndReturn, checkRateLimit, maybeAutoblock }, t (+1 more)

### Community 45 - "new/actions.ts"
Cohesion: 0.30
Nodes (7): createOffer(), blockedRefusal(), activeOffersWhere(), MAX_ACTIVE_OFFERS, offerFieldErrors(), {
  requireOnboardedUser,
  clubFindUnique,
  offerCount,
  offerCreate,
  redirect,
  notifyInterestedPlayers,
  checkRateLimit,
}, valid

### Community 46 - "delete/actions.ts"
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

### Community 47 - "thread-data.ts"
Cohesion: 0.33
Nodes (6): getJoinThread(), ThreadMessage, canWriteToThread(), isJoinThreadParticipant(), JOIN, STARTS_AT

### Community 48 - "offer-card.tsx"
Cohesion: 0.29
Nodes (11): OfferCard(), PlayerAvatar(), formatLabel(), LabelT, levelLabel(), placeLabel(), spotsLabel(), avatarUrl() (+3 more)

### Community 49 - "krakow-time.ts"
Cohesion: 0.30
Nodes (8): NewOfferPage(), daysAhead(), formatKrakowTimeRange(), Formatter, krakowHour(), krakowLocalToDate(), krakowParts, toKrakowLocal()

### Community 50 - "result-form.tsx"
Cohesion: 0.17
Nodes (10): LoginPage(), LoginPageProps, LoginForm(), ActionResult, ErrorText(), FieldErrorLike, GamesRow(), ResultForm() (+2 more)

### Community 51 - "@sentry/nextjs"
Cohesion: 0.31
Nodes (6): onRequestError, register(), scrubEvent(), nextConfig, withNextIntl, @sentry/nextjs

### Community 52 - "offer-details.ts"
Cohesion: 0.20
Nodes (10): getOfferDetails(), OfferDetails, OfferJoinResult, OfferPlayer, playerSelect, resultSelect, toOfferPlayer(), playersNeeded() (+2 more)

### Community 53 - "profile/actions.ts"
Cohesion: 0.32
Nodes (8): SaveAvatarResult, updateProfile(), completeOnboarding(), STARTING_ELO, startingElo(), profileFieldErrors(), profileToUserData(), { findUnique, update, updateMany, exists, remove, redirect }

### Community 54 - "export-user-data.ts"
Cohesion: 0.29
Nodes (7): exportMyData(), ExportDataButton(), download(), exportUserData(), UserDataExport, firstNameAndInitial(), {
  userFindUniqueOrThrow,
  offerFindMany,
  joinFindMany,
  messageFindMany,
  matchResultFindMany,
}

### Community 55 - "auto-confirm.ts"
Cohesion: 0.26
Nodes (7): GET(), RESULT_AUTO_CONFIRMED_MESSAGE, autoConfirmExpiredResults(), { autoConfirmExpiredResults, runNotificationReminders }, { matchResultFindMany, postSystemMessage, tx }, pendingNoShowReport, pendingResult

### Community 57 - "post-system-message.ts"
Cohesion: 0.22
Nodes (7): COURT_BOOKED_MESSAGE, RESULT_SUBMITTED_MESSAGE, THREAD_WELCOME_MESSAGE, ThreadRef, SYSTEM_MESSAGE_KEYS, SystemMessageKey, { messageCreate }

### Community 58 - "clubs-view.tsx"
Cohesion: 0.43
Nodes (6): ClubSelection, ClubSelectionContext, ClubSelectionContextValue, ClubsView(), View, ViewButton()

### Community 59 - "Session 09: Polish i18n and Profile Photo"
Cohesion: 0.33
Nodes (3): CI workflow (ci.yml), Slice J — Before Public Launch, Session 09: Polish i18n and Profile Photo

### Community 61 - "translator.ts"
Cohesion: 0.38
Nodes (4): en, testTranslator(), t, schema

### Community 64 - "elo-rank.ts"
Cohesion: 0.53
Nodes (3): eloDistance(), RankableOffer, rankByEloCloseness()

### Community 66 - "new-offer.test.ts"
Cohesion: 0.40
Nodes (3): NOW, OFFER, { userFindMany, userUpdate, notify }

### Community 67 - "lint-staged"
Cohesion: 0.67
Nodes (3): lint-staged, *.{json,css,yaml,yml}, *.{ts,tsx,mts,js,mjs}

## Knowledge Gaps
- **27 isolated node(s):** `@prisma/client`, `react-dom`, `@tailwindcss/postcss`, `@types/leaflet`, `@types/node` (+22 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 493 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **38 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `vitest` to `next`, `zod`, `result-actions.ts`, `profile/page.tsx`, `clubs/[id]/page.tsx`, `offers/[id]/actions.ts`, `package.json`, `club.ts`, `feed.ts`, `getCurrentUser`, `lib_generated_prisma_enums`, `join-transitions.ts`, `offer-interest.ts`, `avatar-upload.tsx`, `report-actions.ts`, `db.ts`, `app/layout.tsx`, `createSupabaseServerClient`, `buttonVariants`, `options.ts`, `notify`, `notify.ts`, `offers/[id]/page.tsx`, `reliability.ts`, `captureEvent`, `require-user.ts`, `offer.ts`, `create-report.test.ts`, `new/actions.ts`, `delete/actions.ts`, `thread-data.ts`, `offer-card.tsx`, `krakow-time.ts`, `@sentry/nextjs`, `offer-details.ts`, `profile/actions.ts`, `export-user-data.ts`, `auto-confirm.ts`, `post-system-message.ts`, `translator.ts`, `elo-rank.ts`, `new-offer.test.ts`?**
  _High betweenness centrality (0.154) - this node is a cross-community bridge._
- **What connects `@prisma/client`, `react-dom`, `@tailwindcss/postcss` to the rest of the system?**
  _27 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `supabase-admin.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07638279192273925 - nodes in this community are weakly interconnected._
- **Why does `next-intl` connect `next-intl` to `vitest`, `next`, `zod`, `result-actions.ts`, `profile/page.tsx`, `clubs/[id]/page.tsx`, `club-map.tsx`, `offers/[id]/actions.ts`, `package.json`, `feed.ts`, `requireOnboardedUser`, `my-games.tsx`, `getCurrentUser`, `avatar-upload.tsx`, `report-actions.ts`, `offer-form.tsx`, `app/layout.tsx`, `buttonVariants`, `notify.ts`, `offers/[id]/page.tsx`, `require-user.ts`, `new/actions.ts`, `offer-card.tsx`, `krakow-time.ts`, `result-form.tsx`, `@sentry/nextjs`, `profile/actions.ts`, `clubs-view.tsx`, `translator.ts`?**
  _High betweenness centrality (0.136) - this node is a cross-community bridge._
- **Should `next` be split into smaller, more focused modules?**
  _Cohesion score 0.08585858585858586 - nodes in this community are weakly interconnected._
- **Why does `next` connect `next` to `vitest`, `zod`, `result-actions.ts`, `profile/page.tsx`, `clubs/[id]/page.tsx`, `club-map.tsx`, `offers/[id]/actions.ts`, `package.json`, `feed.ts`, `requireOnboardedUser`, `next-intl`, `my-games.tsx`, `getCurrentUser`, `avatar-upload.tsx`, `offer-form.tsx`, `app/layout.tsx`, `createSupabaseServerClient`, `buttonVariants`, `notify.ts`, `offers/[id]/page.tsx`, `require-user.ts`, `new/actions.ts`, `delete/actions.ts`, `offer-card.tsx`, `krakow-time.ts`, `result-form.tsx`, `@sentry/nextjs`, `profile/actions.ts`, `auto-confirm.ts`?**
  _High betweenness centrality (0.083) - this node is a cross-community bridge._
- **Should `zod` be split into smaller, more focused modules?**
  _Cohesion score 0.12312312312312312 - nodes in this community are weakly interconnected._