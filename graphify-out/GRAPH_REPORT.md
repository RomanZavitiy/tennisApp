# Graph Report - tennisApp  (2026-10-21)

## Corpus Check
- 12 files · ~159,511 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1506 nodes · 3670 edges · 120 communities (59 shown, 61 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 63 edges (avg confidence: 0.83)
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
- Community 49
- Community 50
- Community 51
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
- Community 69
- Community 75
- Community 76
- Community 77
- Community 78
- Community 79
- Community 102
- Community 106
- Community 107
- Community 108
- Community 109
- Community 110
- Community 111
- Community 112
- Community 113
- Community 114
- Community 115
- Community 116
- Community 118
- Community 119

## God Nodes (most connected - your core abstractions)
1. `vitest` - 87 edges
2. `next-intl` - 85 edges
3. `next` - 72 edges
4. `db` - 43 edges
5. `react` - 42 edges
6. `Button()` - 40 edges
7. `requireOnboardedUser` - 39 edges
8. `zod` - 28 edges
9. `createAdminClient()` - 25 edges
10. `requireUser()` - 23 edges

## Surprising Connections (you probably didn't know these)
- `Polish support implemented via next-intl in cookie-only mode (no [locale] URL segment); proxy.ts sets the locale cookie from Accept-Language on first request; users.locale column mirrors it for cron-sent mail/push (task 1.20)` --references--> `next-intl`  [EXTRACTED]
  .agents/decisions.md → package.json
- `Map uses leaflet+react-leaflet, loaded client-only via next/dynamic(ssr:false), explicit L.icon with bundled PNGs (task 2.4)` --references--> `react-leaflet`  [EXTRACTED]
  .agents/decisions.md → package.json
- `Login forms via React Hook Form + Zod (@hookform/resolvers); /auth/callback parses params via parseCallbackParams(); email templates link to RedirectTo+token_hash (task 1.6)` --references--> `react-hook-form`  [EXTRACTED]
  .agents/decisions.md → package.json
- `errorsFor()` --calls--> `profileSchema()`  [EXTRACTED]
  tests/lib/validation/profile.test.ts → lib/validation/profile.ts
- `enable()` --indirect_call--> `savePushSubscription()`  [INFERRED]
  components/push-subscribe-control.tsx → app/(member)/profile/notifications/actions.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Slice-Based Session Workflow** — docs_planning, docs_prompts_00_readme, docs_prompts_01_session_audit_and_offer, docs_prompts_02_session_join_flow, docs_prompts_03_session_chat, docs_prompts_04_session_results_and_elo, docs_prompts_05_session_reliability, docs_prompts_06_session_courts_and_booking, docs_prompts_07_session_pwa_and_notifications, docs_prompts_08_session_safety_and_admin, docs_prompts_09_session_polish_and_profile_photo, docs_prompts_10_session_launch_readiness [EXTRACTED 1.00]
- **Court booking epic branch workflow overriding standard AGENTS.md git process** — docs_booking_epic_branch_workflow, agents_section8_git_workflow, agents_decisions_20261021_booking_v1_decision [INFERRED 0.85]
- **RLS deny-by-default evolution across the schema** — agents_decisions_20260929_rls_enabled_no_policies, agents_decisions_20261003_rls_strategy_with_prisma, agents_decisions_20261004_rls_e2e_test, agents_decisions_20261012_messages_model_first_rls [INFERRED 0.85]
- **Tech stack defined consistently across AGENTS.md, README and decisions.md** — agents_decisions_20260920_project_stack, agents_section2_stack, readme_stack_glossary [INFERRED 0.85]

## Communities (120 total, 61 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (56): NotificationsPage(), Card(), ProfilePage(), SettingsLink(), AuthorView(), OfferPage(), OfferPageProps, PlayerLink() (+48 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (59): NewOfferPage(), OffersPage(), OfferCard(), OfferFilters(), aria(), ClubOption, ErrorText(), Field() (+51 more)

### Community 2 - "Community 2"
Cohesion: 0.07
Nodes (35): admin, PNG, admin, created, PNG, signedInClient(), far, near (+27 more)

### Community 3 - "Community 3"
Cohesion: 0.05
Nodes (53): confirmResult(), disputeResult(), ErrorsT, loadSubmittableJoin(), PendingResult, SettleAction, SettleOutcome, settleResult() (+45 more)

### Community 4 - "Community 4"
Cohesion: 0.06
Nodes (45): AdminActionResult, annulDisputedResult(), blockFromReport(), confirmDisputedResult(), dismissReport(), hideReport(), logAction(), unblockPlayer() (+37 more)

### Community 5 - "Community 5"
Cohesion: 0.06
Nodes (46): addDays(), BookPage(), BookPageProps, dateOptions(), generateMetadata(), hrefWith(), Params, parseDate() (+38 more)

### Community 6 - "Community 6"
Cohesion: 0.08
Nodes (34): Home(), ClubFiltersForm(), ClubList(), ClubListEntry(), ClubListItem, ClubMap(), ClubMapMarker, ClubMapProps (+26 more)

### Community 7 - "Community 7"
Cohesion: 0.09
Nodes (30): GET(), DAILY_OFFER_PUSH_LIMIT, hasDailyCapacity(), interestedCandidates(), isInterestedIn(), isQuietHours(), levelMatches(), NewOfferInfo (+22 more)

### Community 8 - "Community 8"
Cohesion: 0.13
Nodes (23): AGENTS.md §2 Stack, GitHub Actions (CI), Next.js, OpenStreetMap, Playwright, pnpm, PostHog EU, Prisma ORM (+15 more)

### Community 9 - "Community 9"
Cohesion: 0.11
Nodes (23): GET(), LanguageSwitcher(), choose(), MESSAGES, CallbackParams, otpTypeSchema, parseCallbackParams(), ensureUserRow() (+15 more)

### Community 10 - "Community 10"
Cohesion: 0.08
Nodes (23): BookingRequestInput, vitest, en, testTranslator(), t, input, { reportCreateManyAndReturn, checkRateLimit, maybeAutoblock }, t (+15 more)

### Community 11 - "Community 11"
Cohesion: 0.09
Nodes (23): upsertClubs(), ClubRecord, clubSchema, CourtHoursRecord, courtHoursRecordSchema, CourtRecord, courtRecordSchema, describe() (+15 more)

### Community 12 - "Community 12"
Cohesion: 0.13
Nodes (29): MEMORY.md (agent working notes), AGENTS.md — SpinBuddy Agent Rules, decisions.md — Architecture Decision Log, Claude Code Planning Prompt, PLANNING-v1.md (archived), Launch Checklist — MatchFinder Kraków, PLANNING.md (v2), Slice A — Sync and Process Lightening (+21 more)

### Community 13 - "Community 13"
Cohesion: 0.12
Nodes (14): signOut(), geistMono, geistSans, RootLayout(), viewport, HeaderNavLinks(), isActive(), NavLink (+6 more)

### Community 14 - "Community 14"
Cohesion: 0.14
Nodes (21): acceptJoin(), cancelOffer(), changeJoin(), declineJoin(), JoinChangeResult, markCourtBooked(), RequestToJoinResult, SendMessageResult (+13 more)

### Community 15 - "Community 15"
Cohesion: 0.08
Nodes (26): eslintConfig, engines, node, name, packageManager, private, version, class-variance-authority (+18 more)

### Community 16 - "Community 16"
Cohesion: 0.17
Nodes (15): sendMagicLink(), SendMagicLinkResult, LoginPage(), LoginPageProps, LoginForm(), onSubmit(), safeNextPath(), loginSchema() (+7 more)

### Community 17 - "Community 17"
Cohesion: 0.21
Nodes (12): EditProfilePage(), aria(), Field(), ProfileForm(), ProfileFormValues, Input(), Label(), NativeSelect() (+4 more)

### Community 18 - "Community 18"
Cohesion: 0.19
Nodes (13): reportMessage(), reportOffer(), reportPlayer(), db, globalForPrisma, createReport(), CreateReportResult, ErrorsT (+5 more)

### Community 19 - "Community 19"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 20 - "Community 20"
Cohesion: 0.09
Nodes (22): dependencies, @base-ui/react, class-variance-authority, cn, @hookform/resolvers, leaflet, lucide-react, next (+14 more)

### Community 21 - "Community 21"
Cohesion: 0.09
Nodes (22): devDependencies, eslint, eslint-config-next, eslint-config-prettier, husky, lint-staged, @playwright/test, prettier (+14 more)

### Community 22 - "Community 22"
Cohesion: 0.19
Nodes (16): saveAvatar(), SaveAvatarResult, updateProfile(), completeOnboarding(), startingElo(), createSupabaseServerClient(), MIN_AGE, PROFILE_FIELDS (+8 more)

### Community 23 - "Community 23"
Cohesion: 0.18
Nodes (12): recordOutboundClick(), savePushSubscription(), OnboardingPage(), track(), captureEvent(), AuthRequiredError, getCurrentUser(), requireUser() (+4 more)

### Community 24 - "Community 24"
Cohesion: 0.17
Nodes (12): createOffer(), requestToJoin(), blockedRefusal(), activeOffersWhere(), MAX_ACTIVE_OFFERS, checkRateLimit(), RATE_LIMITS, RateLimitResult (+4 more)

### Community 25 - "Community 25"
Cohesion: 0.16
Nodes (15): ACTION_ACTOR, JoinAction, joinChangeRefusal, nextJoinStatus(), OfferState, offerStatusFor(), TRANSITIONS, playersNeeded() (+7 more)

### Community 26 - "Community 26"
Cohesion: 0.19
Nodes (11): ClubPage(), ClubPageProps, generateMetadata(), BookingLink(), ExternalLink(), ClubDetails, formatCheckedDate(), Formatter (+3 more)

### Community 27 - "Community 27"
Cohesion: 0.15
Nodes (14): ActionResult, notificationSettingsSchema, updateNotificationSetting(), NotificationSettings, NotificationSettingsForm(), toggle(), ROW_KEYS, Switch() (+6 more)

### Community 28 - "Community 28"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 29 - "Community 29"
Cohesion: 0.25
Nodes (15): removePushSubscription(), initialStatus(), PushSubscribeControl(), disable(), enable(), Status, hasActivePushSubscription(), isIos() (+7 more)

### Community 30 - "Community 30"
Cohesion: 0.21
Nodes (5): giveConsent(), ConsentPage(), CURRENT_CONSENT_VERSION, needsConsent(), { update, redirect }

### Community 31 - "Community 31"
Cohesion: 0.15
Nodes (5): ExportDataPage(), ExportDataButton(), nextConfig, withNextIntl, next-intl

### Community 32 - "Community 32"
Cohesion: 0.25
Nodes (6): AccountDeletedPage(), DeleteAccountPage(), OfferActionButton(), OfferBookingSection(), Button(), buttonVariants

### Community 33 - "Community 33"
Cohesion: 0.23
Nodes (11): markNotificationsReadAction(), offerIdSchema, unreadNotificationCount(), countUnreadNotifications(), InboxNotification, markNotificationsRead(), NOTIFICATIONS_SHOWN, recordNotification() (+3 more)

### Community 34 - "Community 34"
Cohesion: 0.23
Nodes (11): sendMessage(), JoinThread(), MessageThread(), addMessage(), submit(), getJoinThread(), ThreadMessage, canWriteToThread() (+3 more)

### Community 35 - "Community 35"
Cohesion: 0.25
Nodes (10): confirmUnsubscribe(), UnsubscribeResult, UnsubscribePage(), UnsubscribePageProps, UnsubscribeButton(), createUnsubscribeToken(), secret(), sign() (+2 more)

### Community 36 - "Community 36"
Cohesion: 0.29
Nodes (12): ACCEPT, AvatarUpload(), choose(), reset(), save(), AVATAR_BUCKET, AVATAR_MAX_BYTES, AVATAR_TYPES (+4 more)

### Community 37 - "Community 37"
Cohesion: 0.24
Nodes (9): MobileNav(), NavLink, Sheet(), SheetContent(), SheetOverlay(), SheetPortal(), SheetTitle(), SheetTrigger() (+1 more)

### Community 38 - "Community 38"
Cohesion: 0.14
Nodes (12): getClient(), sendEmail(), SendEmailInput, SendEmailOutcome, resend, { createUnsubscribeToken }, NOW, { recordNotification } (+4 more)

### Community 39 - "Community 39"
Cohesion: 0.13
Nodes (15): scripts, build, check:i18n-keys, check:i18n-strings, clubs:load, dev, format, format:check (+7 more)

### Community 40 - "Community 40"
Cohesion: 0.26
Nodes (7): GoogleSignInButton(), signIn(), MessageRow, ThreadMessage, createSupabaseBrowserClient(), supabaseEnv(), @supabase/ssr

### Community 41 - "Community 41"
Cohesion: 0.22
Nodes (12): EmailTemplateInput, escapeHtml(), renderEmailHtml(), renderEmailText(), appUrl(), CATEGORY, claimMessagePushSlot(), deliver() (+4 more)

### Community 42 - "Community 42"
Cohesion: 0.23
Nodes (8): MarkMeaningfulAction(), dismiss(), dismissed(), initialVisibility(), hide(), Visibility, hasMeaningfulAction(), markMeaningfulAction()

### Community 43 - "Community 43"
Cohesion: 0.21
Nodes (13): Booking (booking schema entity), Club.bookingMode enum (EXTERNAL_LINK / SPINBUDDY), ClubStaff (booking schema entity), Court (booking schema entity), CourtBlock (booking schema entity), CourtHours (booking schema entity), Session 0 — Epic setup, Session 11 — Decision + data model (K.1-K.5) (+5 more)

### Community 44 - "Community 44"
Cohesion: 0.21
Nodes (9): AnalyticsEvent, EventProperties, OfferFormat, OutboundTarget, PropertiesFor, BANNED_PROPERTY_KEYS, getClient(), sanitize() (+1 more)

### Community 45 - "Community 45"
Cohesion: 0.20
Nodes (5): keyPaths(), main(), Messages, { findUnique }, en

### Community 46 - "Community 46"
Cohesion: 0.36
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

### Community 47 - "Community 47"
Cohesion: 0.31
Nodes (6): exportMyData(), download(), exportUserData(), UserDataExport, firstNameAndInitial(), {
  userFindUniqueOrThrow,
  offerFindMany,
  joinFindMany,
  messageFindMany,
  matchResultFindMany,
}

### Community 49 - "Community 49"
Cohesion: 0.31
Nodes (5): MemberLayout(), NotificationSettingsPage(), requireOnboardedUser, complete, { findUnique, redirect }

### Community 50 - "Community 50"
Cohesion: 0.47
Nodes (4): onRequestError, register(), scrubEvent(), @sentry/nextjs

### Community 53 - "Community 53"
Cohesion: 0.36
Nodes (5): NTRP_LEVELS, NTRP_MAX, NTRP_MIN, NTRP_STEP, STARTING_ELO

### Community 54 - "Community 54"
Cohesion: 0.32
Nodes (7): ensureVapidConfigured(), isExpired(), PushPayload, PushSubscriptionKeys, sendPush(), SendPushOutcome, web-push

### Community 55 - "Community 55"
Cohesion: 0.33
Nodes (4): AGENTS.md §1 Project in one paragraph, AGENTS.md §9 Boundaries, EU sui generis database right (Directive 96/9/EC), Court Booking Epic (Slice K) — Session Prompts

### Community 58 - "Community 58"
Cohesion: 0.48
Nodes (5): AUTOBLOCK_THRESHOLD, AUTOBLOCK_WINDOW_DAYS, maybeAutoblock(), shouldAutoblock(), { reportFindMany, userUpdateMany, adminActionCreate }

### Community 60 - "Community 60"
Cohesion: 0.47
Nodes (3): joinRefusal, NOW, refusal()

### Community 61 - "Community 61"
Cohesion: 0.40
Nodes (3): canCancelOffer(), LATER, NOW

### Community 62 - "Community 62"
Cohesion: 0.50
Nodes (3): AGENTS.md §8 Git workflow, booking-epic integration branch workflow, Session 16 — Partner integration (separate epic)

### Community 64 - "Community 64"
Cohesion: 0.50
Nodes (3): createdAt, {
  requireOnboardedUser,
  joinFindUnique,
  messageCreate,
  notify,
  checkRateLimit,
}, upcomingJoin

### Community 66 - "Community 66"
Cohesion: 0.67
Nodes (3): lint-staged, *.{json,css,yaml,yml}, *.{ts,tsx,mts,js,mjs}

## Knowledge Gaps
- **43 isolated node(s):** `husky`, `lint-staged`, `prettier`, `@prisma/client`, `react-dom` (+38 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 567 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **61 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next-intl` connect `Community 31` to `Community 0`, `Community 1`, `Community 3`, `Community 4`, `Community 5`, `Community 6`, `Community 8`, `Community 9`, `Community 10`, `Community 13`, `Community 14`, `Community 15`, `Community 16`, `Community 17`, `Community 18`, `Community 22`, `Community 23`, `Community 24`, `Community 26`, `Community 27`, `Community 29`, `Community 30`, `Community 32`, `Community 34`, `Community 35`, `Community 36`, `Community 37`, `Community 40`, `Community 41`, `Community 42`, `Community 45`, `Community 49`?**
  _High betweenness centrality (0.214) - this node is a cross-community bridge._
- **What connects `husky`, `lint-staged`, `prettier` to the rest of the system?**
  _43 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.052100840336134456 - nodes in this community are weakly interconnected._
- **Why does `vitest` connect `Community 10` to `Community 0`, `Community 1`, `Community 3`, `Community 4`, `Community 5`, `Community 6`, `Community 7`, `Community 9`, `Community 11`, `Community 14`, `Community 15`, `Community 16`, `Community 18`, `Community 22`, `Community 23`, `Community 24`, `Community 25`, `Community 26`, `Community 27`, `Community 29`, `Community 30`, `Community 33`, `Community 34`, `Community 35`, `Community 36`, `Community 38`, `Community 40`, `Community 42`, `Community 44`, `Community 45`, `Community 46`, `Community 47`, `Community 49`, `Community 50`, `Community 53`, `Community 58`, `Community 60`, `Community 61`, `Community 64`?**
  _High betweenness centrality (0.142) - this node is a cross-community bridge._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.05092592592592592 - nodes in this community are weakly interconnected._
- **Why does `Zod` connect `Community 8` to `Community 48`?**
  _High betweenness centrality (0.083) - this node is a cross-community bridge._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.07404426559356136 - nodes in this community are weakly interconnected._