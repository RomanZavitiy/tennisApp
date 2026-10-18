# Graph Report - tennisApp  (2026-10-18)

## Corpus Check
- 351 files · ~146,859 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 10 file(s) not represented in the graph (top: (none) 5, .example 1, .ico 1)

## Summary
- 1374 nodes · 3594 edges · 91 communities (53 shown, 38 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 70 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `aebcb356`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- sheet.tsx
- supabase-admin.ts
- next
- zod
- result-actions.ts
- offers/[id]/page.tsx
- clubs/[id]/page.tsx
- club-map.tsx
- offers/[id]/actions.ts
- package.json
- club.ts
- offers/page.tsx
- requireOnboardedUser
- report-form.tsx
- next-intl
- components.json
- dependencies
- devDependencies
- getCurrentUser
- cancel-rules.ts
- join-transitions.ts
- offer-interest.ts
- PLANNING.md (v2)
- buttonVariants
- report-actions.ts
- db.ts
- compilerOptions
- offer-form.tsx
- app/layout.tsx
- AGENTS.md
- Direct Migration Apply, Bypassing Prisma Shadow DB
- send-message.test.ts
- buttonVariants
- require-user.ts
- notify.ts
- scripts
- Button
- captureEvent
- offer.ts
- Session 04: Results and ELO
- create-report.test.ts
- new/actions.ts
- delete/actions.ts
- lib_generated_prisma_enums
- krakow-time.ts
- @sentry/nextjs
- feed.ts
- export-user-data.ts
- message-thread.tsx
- clubs-view.tsx
- Session 09: Polish i18n and Profile Photo
- vitest
- elo-rank.ts
- Session 08: Safety and Admin
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
2. `next-intl` - 81 edges
3. `next` - 71 edges
4. `Button()` - 46 edges
5. `db` - 42 edges
6. `react` - 42 edges
7. `requireOnboardedUser` - 40 edges
8. `buttonVariants` - 34 edges
9. `getCurrentUser()` - 26 edges
10. `zod` - 26 edges

## Surprising Connections (you probably didn't know these)
- `refusal()` --calls--> `joinChangeRefusal`  [EXTRACTED]
  tests/lib/offers/join-transitions.test.ts → lib/offers/join-transitions.ts
- `Slice = Branch = PR Workflow` --conceptually_related_to--> `Slice A — Sync and Process Lightening`  [INFERRED]
  AGENTS.md → docs/PLANNING.md
- `Claude Code Planning Prompt` --references--> `PLANNING-v1.md (archived)`  [INFERRED]
  claude-code-planning-prompt.md → docs/archive/PLANNING-v1.md
- `Stop-and-Ask Conditions` --conceptually_related_to--> `Account Deletion: Owner-Run Manual Process (superseded same day)`  [INFERRED]
  AGENTS.md → .agents/decisions.md
- `MemberLayout()` --calls--> `requireOnboardedUser`  [EXTRACTED]
  app/(member)/layout.tsx → lib/auth/require-onboarded-user.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Migrations Applied Around the Broken Prisma Shadow DB** — _agents_decisions_shadow_db_migration_workaround, _agents_decisions_court_status_field, _agents_decisions_system_messages_type, _agents_decisions_matchresult_model, _agents_decisions_no_show_handling, _agents_decisions_reliability_counters, _agents_decisions_notifications_schema_user_email, _agents_decisions_reports_admin_schema, _agents_decisions_polish_i18n_nextintl, _agents_decisions_legal_draft_pages [EXTRACTED 1.00]
- **Slice-Based Session Workflow** — agents_slice_workflow, docs_planning, docs_prompts_00_readme, docs_prompts_01_session_audit_and_offer, docs_prompts_02_session_join_flow, docs_prompts_03_session_chat, docs_prompts_04_session_results_and_elo, docs_prompts_05_session_reliability, docs_prompts_06_session_courts_and_booking, docs_prompts_07_session_pwa_and_notifications, docs_prompts_08_session_safety_and_admin, docs_prompts_09_session_polish_and_profile_photo, docs_prompts_10_session_launch_readiness [EXTRACTED 1.00]
- **ELO Rating Subsystem** — _agents_decisions_starting_elo_ntrp, _agents_decisions_elo_field_user, _agents_decisions_elo_formula, _agents_decisions_feed_elo_ranking, _agents_decisions_feed_ranking_wired, _agents_decisions_matchresult_model, _agents_decisions_result_confirmation [INFERRED 0.85]

## Communities (91 total, 38 thin omitted)

### Community 0 - "sheet.tsx"
Cohesion: 0.21
Nodes (10): MobileNav(), NavLink, Sheet(), SheetContent(), SheetOverlay(), SheetPortal(), SheetTitle(), SheetTrigger() (+2 more)

### Community 1 - "supabase-admin.ts"
Cohesion: 0.07
Nodes (35): admin, PNG, admin, created, PNG, signedInClient(), far, near (+27 more)

### Community 2 - "next"
Cohesion: 0.11
Nodes (29): AdminActionResult, annulDisputedResult(), blockFromReport(), confirmDisputedResult(), dismissReport(), hideReport(), logAction(), unblockPlayer() (+21 more)

### Community 3 - "zod"
Cohesion: 0.09
Nodes (38): ActionResult, notificationSettingsSchema, removePushSubscription(), savePushSubscription(), updateNotificationSetting(), MarkMeaningfulAction(), NotificationSettings, NotificationSettingsForm() (+30 more)

### Community 4 - "result-actions.ts"
Cohesion: 0.05
Nodes (52): GET(), JoinChangeResult, confirmResult(), disputeResult(), ErrorsT, loadSubmittableJoin(), PendingResult, SettleAction (+44 more)

### Community 5 - "offers/[id]/page.tsx"
Cohesion: 0.06
Nodes (57): Card(), ProfilePage(), SettingsLink(), AuthorView(), OfferPage(), OfferPageProps, PlayerLink(), ResultSection() (+49 more)

### Community 6 - "clubs/[id]/page.tsx"
Cohesion: 0.21
Nodes (10): ClubPage(), ClubPageProps, generateMetadata(), ExternalLink(), ClubDetails, formatCheckedDate(), Formatter, getClub() (+2 more)

### Community 7 - "club-map.tsx"
Cohesion: 0.19
Nodes (13): ClubMap(), ClubMapMarker, ClubMapProps, FIT_PADDING, FitToContainer(), KRAKOW_CENTER, ShowClubPickedInList(), ClubMap() (+5 more)

### Community 8 - "offers/[id]/actions.ts"
Cohesion: 0.15
Nodes (22): acceptJoin(), cancelOffer(), changeJoin(), declineJoin(), markCourtBooked(), RequestToJoinResult, SendMessageResult, withdrawJoin() (+14 more)

### Community 9 - "package.json"
Cohesion: 0.08
Nodes (26): eslintConfig, name, packageManager, private, version, class-variance-authority, eslint, eslint-config-next (+18 more)

### Community 10 - "club.ts"
Cohesion: 0.10
Nodes (19): ClubRecord, clubSchema, describe(), httpUrl, KRAKOW_BOUNDS, parseClubFile(), todayInKrakow(), main() (+11 more)

### Community 11 - "offers/page.tsx"
Cohesion: 0.19
Nodes (10): OffersPage(), FEED_PAGE_SIZE, feedHref(), parseFeedFilters(), getOfferFeed(), parsePage(), BASE, NOW (+2 more)

### Community 12 - "requireOnboardedUser"
Cohesion: 0.18
Nodes (10): MemberLayout(), DeleteAccountPage(), exportMyData(), ExportDataPage(), NotificationSettingsPage(), ExportDataButton(), download(), requireOnboardedUser (+2 more)

### Community 13 - "report-form.tsx"
Cohesion: 0.31
Nodes (6): ReportActionResult, ReportButton(), ReportActionResult, ReportForm(), Textarea(), REPORT_COMMENT_MAX

### Community 14 - "next-intl"
Cohesion: 0.09
Nodes (18): signOut(), geistMono, geistSans, RootLayout(), viewport, HeaderNavLinks(), isActive(), NavLink (+10 more)

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
Cohesion: 0.13
Nodes (19): recordOutboundClick(), markNotificationsReadAction(), offerIdSchema, unreadNotificationCount(), NotificationsPage(), track(), MarkNotificationsRead(), NOTIFICATIONS_CHANGED_EVENT (+11 more)

### Community 19 - "cancel-rules.ts"
Cohesion: 0.40
Nodes (3): canCancelOffer(), LATER, NOW

### Community 20 - "join-transitions.ts"
Cohesion: 0.18
Nodes (11): ACTION_ACTOR, JoinAction, OfferState, TRANSITIONS, doubles, doublesWithPartner, LATER, NOW (+3 more)

### Community 21 - "offer-interest.ts"
Cohesion: 0.14
Nodes (19): DAILY_OFFER_PUSH_LIMIT, hasDailyCapacity(), interestedCandidates(), isInterestedIn(), isQuietHours(), levelMatches(), NewOfferInfo, NTRP_MATCH_TOLERANCE (+11 more)

### Community 22 - "PLANNING.md (v2)"
Cohesion: 0.18
Nodes (17): decisions.md (architecture decision log), MEMORY.md (agent working notes), Two-Strikes Rule, PLANNING-v1.md (archived), PLANNING.md (v2), Slice A — Sync and Process Lightening, Slice B — Finish the Offer, Slice C — Join and Accept (+9 more)

### Community 23 - "buttonVariants"
Cohesion: 0.35
Nodes (8): AccountDeletedPage(), Home(), ClubFiltersForm(), ClubList(), ClubListEntry(), buttonVariants, clubsHref(), DISTRICT_LABELS

### Community 24 - "report-actions.ts"
Cohesion: 0.22
Nodes (14): reportMessage(), reportOffer(), reportPlayer(), createReport(), CreateReportResult, ErrorsT, emptyToUndefined(), ReportInput (+6 more)

### Community 25 - "db.ts"
Cohesion: 0.16
Nodes (8): db, globalForPrisma, getMyUpcomingGames(), MyGame, MyGameRole, offerSelect, NOW, { offerFindMany, joinFindMany }

### Community 26 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 27 - "offer-form.tsx"
Cohesion: 0.11
Nodes (26): EditProfilePage(), OfferFilters(), aria(), ClubOption, ErrorText(), Field(), FieldErrorLike, NtrpSelect() (+18 more)

### Community 28 - "app/layout.tsx"
Cohesion: 0.06
Nodes (41): GET(), sendMagicLink(), SendMagicLinkResult, LoginPage(), LoginPageProps, choose(), LoginForm(), onSubmit() (+33 more)

### Community 29 - "AGENTS.md"
Cohesion: 0.18
Nodes (5): Change-Size Discipline, Slice = Branch = PR Workflow, Stop-and-Ask Conditions, Claude Code Planning Prompt, Session 10: Launch Readiness

### Community 31 - "send-message.test.ts"
Cohesion: 0.50
Nodes (3): createdAt, {
  requireOnboardedUser,
  joinFindUnique,
  messageCreate,
  notify,
  checkRateLimit,
}, upcomingJoin

### Community 32 - "buttonVariants"
Cohesion: 0.17
Nodes (13): ClubListItem, ClubFilters, clubWhere(), fields, first(), parseClubFilters(), SearchParams, ClubSearchResult (+5 more)

### Community 33 - "require-user.ts"
Cohesion: 0.06
Nodes (50): giveConsent(), ConsentPage(), saveAvatar(), SaveAvatarResult, updateProfile(), completeOnboarding(), OnboardingPage(), ACCEPT (+42 more)

### Community 35 - "notify.ts"
Cohesion: 0.06
Nodes (44): confirmUnsubscribe(), UnsubscribeResult, UnsubscribePage(), UnsubscribePageProps, UnsubscribeButton(), getClient(), sendEmail(), SendEmailInput (+36 more)

### Community 36 - "scripts"
Cohesion: 0.13
Nodes (15): scripts, build, check:i18n-keys, check:i18n-strings, clubs:load, dev, format, format:check (+7 more)

### Community 37 - "Button"
Cohesion: 0.27
Nodes (7): ErrorPage(), BookingLink(), OfferActionButton(), OfferBookingSection(), Button(), addUtmSource(), react

### Community 39 - "captureEvent"
Cohesion: 0.21
Nodes (9): AnalyticsEvent, EventProperties, OfferFormat, OutboundTarget, PropertiesFor, BANNED_PROPERTY_KEYS, getClient(), sanitize() (+1 more)

### Community 41 - "offer.ts"
Cohesion: 0.15
Nodes (16): DEFAULT_OFFER_DURATION, isOfferDuration(), OfferDuration, offerEndsAt(), COMMENT_MAX, CreateOfferResult, emptyToUndefined(), OFFER_FIELDS (+8 more)

### Community 43 - "Session 04: Results and ELO"
Cohesion: 0.20
Nodes (3): Notification Reminders workflow, Slice E — Result and ELO, Session 04: Results and ELO

### Community 44 - "create-report.test.ts"
Cohesion: 0.48
Nodes (5): AUTOBLOCK_THRESHOLD, AUTOBLOCK_WINDOW_DAYS, maybeAutoblock(), shouldAutoblock(), { reportFindMany, userUpdateMany, adminActionCreate }

### Community 45 - "new/actions.ts"
Cohesion: 0.17
Nodes (13): createOffer(), requestToJoin(), captureEvent(), blockedRefusal(), activeOffersWhere(), MAX_ACTIVE_OFFERS, checkRateLimit(), RATE_LIMITS (+5 more)

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

### Community 47 - "lib_generated_prisma_enums"
Cohesion: 0.17
Nodes (11): PlayerView(), JoinThread(), getJoinThread(), ThreadMessage, canWriteToThread(), isJoinThreadParticipant(), joinRefusal, JOIN (+3 more)

### Community 49 - "krakow-time.ts"
Cohesion: 0.20
Nodes (12): NewOfferPage(), daysAhead(), fields, matchesTimeOfDay(), SearchParams, TimeOfDay, TIMES_OF_DAY, Formatter (+4 more)

### Community 51 - "@sentry/nextjs"
Cohesion: 0.31
Nodes (6): onRequestError, register(), scrubEvent(), nextConfig, withNextIntl, @sentry/nextjs

### Community 52 - "feed.ts"
Cohesion: 0.29
Nodes (6): FeedOffer, feedOfferSelect, FeedPage, FeedFilters, toFeedOffer(), playersNeeded()

### Community 54 - "export-user-data.ts"
Cohesion: 0.39
Nodes (4): exportUserData(), UserDataExport, firstNameAndInitial(), {
  userFindUniqueOrThrow,
  offerFindMany,
  joinFindMany,
  messageFindMany,
  matchResultFindMany,
}

### Community 57 - "message-thread.tsx"
Cohesion: 0.22
Nodes (11): sendMessage(), MessageRow, MessageThread(), addMessage(), submit(), ThreadMessage, isSystemMessageKey(), SYSTEM_MESSAGE_KEYS (+3 more)

### Community 58 - "clubs-view.tsx"
Cohesion: 0.43
Nodes (6): ClubSelection, ClubSelectionContext, ClubSelectionContextValue, ClubsView(), View, ViewButton()

### Community 59 - "Session 09: Polish i18n and Profile Photo"
Cohesion: 0.33
Nodes (3): CI workflow (ci.yml), Slice J — Before Public Launch, Session 09: Polish i18n and Profile Photo

### Community 61 - "vitest"
Cohesion: 0.13
Nodes (12): vitest, en, testTranslator(), t, input, { reportCreateManyAndReturn, checkRateLimit, maybeAutoblock }, t, tRateLimit (+4 more)

### Community 64 - "elo-rank.ts"
Cohesion: 0.53
Nodes (3): eloDistance(), RankableOffer, rankByEloCloseness()

### Community 67 - "lint-staged"
Cohesion: 0.67
Nodes (3): lint-staged, *.{json,css,yaml,yml}, *.{ts,tsx,mts,js,mjs}

## Knowledge Gaps
- **27 isolated node(s):** `@prisma/client`, `react-dom`, `@tailwindcss/postcss`, `@types/leaflet`, `@types/node` (+22 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 494 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **38 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `vitest` to `next`, `zod`, `result-actions.ts`, `offers/[id]/page.tsx`, `clubs/[id]/page.tsx`, `offers/[id]/actions.ts`, `package.json`, `club.ts`, `offers/page.tsx`, `requireOnboardedUser`, `next-intl`, `getCurrentUser`, `cancel-rules.ts`, `join-transitions.ts`, `offer-interest.ts`, `report-actions.ts`, `db.ts`, `app/layout.tsx`, `send-message.test.ts`, `buttonVariants`, `require-user.ts`, `notify.ts`, `Button`, `captureEvent`, `offer.ts`, `create-report.test.ts`, `new/actions.ts`, `delete/actions.ts`, `lib_generated_prisma_enums`, `krakow-time.ts`, `@sentry/nextjs`, `feed.ts`, `export-user-data.ts`, `elo-rank.ts`?**
  _High betweenness centrality (0.149) - this node is a cross-community bridge._
- **What connects `@prisma/client`, `react-dom`, `@tailwindcss/postcss` to the rest of the system?**
  _27 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `supabase-admin.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07404426559356136 - nodes in this community are weakly interconnected._
- **Why does `next-intl` connect `next-intl` to `sheet.tsx`, `next`, `zod`, `result-actions.ts`, `offers/[id]/page.tsx`, `clubs/[id]/page.tsx`, `club-map.tsx`, `offers/[id]/actions.ts`, `package.json`, `offers/page.tsx`, `requireOnboardedUser`, `report-form.tsx`, `getCurrentUser`, `buttonVariants`, `report-actions.ts`, `offer-form.tsx`, `app/layout.tsx`, `require-user.ts`, `notify.ts`, `Button`, `new/actions.ts`, `lib_generated_prisma_enums`, `krakow-time.ts`, `@sentry/nextjs`, `message-thread.tsx`, `clubs-view.tsx`, `vitest`?**
  _High betweenness centrality (0.113) - this node is a cross-community bridge._
- **Should `next` be split into smaller, more focused modules?**
  _Cohesion score 0.1076923076923077 - nodes in this community are weakly interconnected._
- **Why does `next` connect `next-intl` to `sheet.tsx`, `next`, `zod`, `result-actions.ts`, `offers/[id]/page.tsx`, `clubs/[id]/page.tsx`, `club-map.tsx`, `offers/[id]/actions.ts`, `package.json`, `offers/page.tsx`, `requireOnboardedUser`, `getCurrentUser`, `buttonVariants`, `offer-form.tsx`, `app/layout.tsx`, `require-user.ts`, `notify.ts`, `Button`, `new/actions.ts`, `delete/actions.ts`, `krakow-time.ts`, `@sentry/nextjs`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Should `zod` be split into smaller, more focused modules?**
  _Cohesion score 0.08627450980392157 - nodes in this community are weakly interconnected._