# SpinBuddy — огляд застосунку: фічі, сторінки, ендпоінти

Одне місце, де описано, **що вміє застосунок** і **який ендпоінт що робить**. Зібрано з коду
станом на 2026-11-25 (гілка `feat/PD-followup-padel-admin`). Правила роботи — у
[AGENTS.md](../AGENTS.md), відкриті задачі — у [ROADMAP.md](./ROADMAP.md), падел — у
[PADEL-PLAN.md](./PADEL-PLAN.md).

> Якщо додаєш нову сторінку чи server action — допиши рядок сюди, інакше документ застаріє.

---

## 1. Як влаштований бекенд (коротко)

У проєкті майже немає класичних REST-ендпоінтів. Бекенд складається з трьох частин:

| Що | Скільки | Де |
|---|---|---|
| **Route handlers** (справжні HTTP-ендпоінти) | 2 | `app/api/cron/route.ts`, `app/auth/callback/route.ts` |
| **Server actions** (функції з `"use server"`, Next.js сам робить з них POST-ендпоінти) | ~90 у 38 файлах | `app/**/actions.ts`, `app/**/*-actions.ts`, `lib/**/actions.ts` |
| **Server Components** (сторінки читають БД напряму через Prisma) | ~35 сторінок | `app/**/page.tsx` |

Важливі наскрізні правила:

- **`proxy.ts`** (middleware) запускається перед кожною сторінкою: оновлює сесію Supabase,
  при першому візиті ставить мову (cookie `NEXT_LOCALE` з `Accept-Language`) і відправляє
  незалогінених з непублічних сторінок на `/login?next=…`. Список публічних сторінок —
  `lib/auth/routes.ts`.
- **Proxy захищає лише сторінки.** Кожна server action сама перевіряє користувача:
  - `requireUser()` — є сесія;
  - `requireOnboardedUser()` — є сесія **і** заповнений профіль (інакше → `/onboarding`),
    а також актуальна згода з умовами (інакше → `/consent`);
  - `requireAdmin()` — `users.isAdmin = true`, інакше 404;
  - `requireClubStaff(clubId)` — запис у `ClubStaff` (OWNER/STAFF) для цього клубу, інакше 404.
- **Усі вхідні дані** проходять Zod-схему з `lib/validation/` перед записом у БД.
- **id користувача ніколи не береться з запиту** — тільки з сесії.
- **Rate limit** — таблиця-лічильник у Postgres (`lib/rate-limit/check-rate-limit.ts`), див. §6.
- **Feature flags** — `lib/features.ts`. Зараз **вимкнені**: `leaderboard`, `coaches`,
  `clubChat` (приховані до ~50 активних гравців). Вимкнена секція віддає 404, її actions
  відмовляють.
- **Вид спорту** — cookie `SB_SPORT` (Tennis/Padel), перемикач у хедері. Від нього залежать
  фід пропозицій, клуби й шкала рівня.

---

## 2. Фічі застосунку

### Акаунт і профіль
- **Вхід** через magic link або одноразовий код з email, а також Google (Supabase Auth).
- **Онбординг**: ім'я, стать, дата народження, район, рівень NTRP. З NTRP рахується
  стартовий ELO (4.0 = 1500, кожні пів рівня = 100 очок).
- **Профіль**: фото (Supabase Storage), редагування, «Коли я люблю грати» (дні/час),
  «Мій падел» (рівень 1–7, сторона LEFT/RIGHT/BOTH), видимість для пошуку кандидатів
  (`discoverable`).
- **Публічний профіль гравця** `/players/[id]`: рейтинг, надійність, бейджі, історія матчів.
- **Досягнення** (рахуються «на льоту» з лічильників, без окремої таблиці) і **бейджі** з
  відгуків (публічний бейдж — коли той самий тег дали ≥5 різних гравців).
- **Приватна підказка рівня** («грає сильніше/слабше за свій NTRP») — бачить лише сам гравець,
  коли ≥3 суперники погодились; на ELO не впливає.
- **Приватність (GDPR)**: експорт своїх даних (JSON), видалення акаунта (редагування даних
  у БД → Storage/Auth → вихід), згода з умовами.
- **Мова**: EN / PL (next-intl, `messages/`), **тема**: світла/темна.

### Пропозиції гри (оферти) — ядро
- **Створення оферти** `/offers/new`: клуб, дата/час, тривалість, діапазон рівня, район,
  стать гри (ANY/MEN/WOMEN/MIXED), формат (SINGLES/DOUBLES), публічна/приватна,
  статус корту (BOOKED/WILL_BOOK/ANY). Падел — завжди парний.
- **Фід** `/offers`: фільтри в URL (дата, район, рівень, час доби). Для залогіненого —
  сортування за близькістю ELO, для гостя — за датою. Оферту можна приховати з фіду
  («не цікаво»).
- **«Шукають гру»** `/offers/looking`: гравець публікує намір «хочу зіграти в цей день»
  (PlayIntent, один на день/спорт, спливає опівночі за Варшавою). Автор оферти може запросити
  такого гравця у свою гру.
- **«Грати сьогодні»** `/offers/today`: оферти, що стартують у найближчі 8 годин і
  підходять за рівнем, плюс сьогоднішні наміри.
- **Заявка на участь** → автор приймає/відхиляє → у кожної заявки свій приватний **чат**.
  Гравець може відкликати заявку, автор — скасувати оферту.
- **Запрошення**: автор запрошує конкретного гравця (з профілю, зі списку кандидатів,
  «зіграти ще раз»), запрошує **улюблених гравців** (до 20 в списку) або вмикає
  **секретне посилання-запрошення** — хто відкрив, одразу отримує місце.
- **Кандидати** — до 10 гравців, підібраних за рівнем, районом і надійністю (≥80%).
- **Резерв (waitlist)**: коли місць немає — стаєш у чергу; щойно місце звільняється,
  перший у черзі отримує пріоритетну заявку (з таймаутом, який обробляє cron).
- **«Корт заброньовано»** — автор позначає, учасники отримують сповіщення.

### Результати, ELO, надійність
- **Одиночний матч**: будь-яка сторона подає рахунок або «суперник не прийшов» →
  інша сторона підтверджує чи оскаржує. Без реакції — **автопідтвердження через 72 год** (cron).
- **ELO**: `E = 1 / (1 + 10^((Rb − Ra)/400))`, K = 40 для перших 10 матчів, далі 20,
  мінімум 100 (`lib/rating/elo.ts`).
- **Парний матч (падел)**: рейтинг пари = середнє гравців, кожен рухається зі своїм K.
  Окремий падел-ELO. Тенісний парний результат рейтинг не змінює.
- **Надійність**: % запланованих матчів без неявки та без пізнього скасування (<12 год до
  старту). Показується після ≥3 матчів, до того — «Новий гравець».
- **Відгук про суперника** після підтвердженого матчу: теги PUNCTUAL / LEVEL_MATCHES_NTRP /
  GOOD_GAME + сигнал рівня HIGHER/LOWER.
- **Leaderboard** `/leaderboard` (вимкнено флагом): топ-100 за ELO, окремо теніс і падел.

### Клуби та бронювання
- **Пошук кортів** `/clubs`: список + карта (Leaflet/OSM), фільтри; лише клуби поточного спорту.
- **Сторінка клубу** `/clubs/[id]`: деталі, корти, активні оферти, кнопки бронювання/телефону
  (кліки логуються в `OutboundClick`).
- **Два режими бронювання** (`Club.bookingMode`):
  - `EXTERNAL_LINK` (більшість клубів) — посилання на сайт клубу;
  - `SPINBUDDY` (партнерські клуби, зараз лише демо) — сітка корти × час `/clubs/[id]/book`,
    гравець надсилає **запит**, персонал клубу підтверджує/відхиляє. Без оплат.
    Скасувати свою бронь можна не пізніше ніж за 12 год. Як підключити клуб — ROADMAP.md.
- **Панель клубу** `/club/[clubId]` для персоналу: черга запитів, сітка на сьогодні/завтра,
  блокування слотів (бронь по телефону, ремонт), новини клубу.
- **Запропонувати клуб** `/clubs/suggest` → адмін схвалює/відхиляє (сам Club створює
  власник через `prisma/load-clubs.ts`).
- **Підписка на клуб + клубний чат + новини** (вимкнено флагом `clubChat`).
- **Довідник тренерів** `/coaches` (вимкнено флагом `coaches`): курований власником список.

### Сповіщення
- Єдина точка входу `notify(userId, event)` (`lib/notifications/notify.ts`):
  1. запис у **in-app список** (дзвіночок у хедері, `/notifications`);
  2. **Web Push** на всі підписки користувача (VAPID, PWA);
  3. **email fallback** (Resend) — лише для трьох ключових подій і лише коли немає push-підписки.
- Мова сповіщення — збережена `users.locale`.
- Типи (`NotificationKind`): заявка, прийнято, відхилено, нове повідомлення, корт заброньовано,
  нагадування за ~3 год, «як зіграли?», нагадування підтвердити результат, нова оферта для
  твого рівня, запрошення отримано/прийнято, звільнилось місце, хтось шукає гру під твою оферту,
  улюблений гравець створив гру.
- Налаштування — три перемикачі в `/profile/notifications`; відписка від email без логіну
  `/unsubscribe` (підписаний токен).
- **PWA**: `app/manifest.ts`, `public/sw.js`, інструкція встановлення `/install`.

### Модерація та адмінка
- **Скарги** на оферту, повідомлення (в т.ч. клубного чату) або гравця.
- **Автоблок**: 3 скарги від різних людей за 30 днів → гравець блокується до рішення адміна.
- **Особисте блокування**: гравець блокує іншого для себе (не бачать одне одного, не можуть
  взаємодіяти) — окремо від скарг.
- **Адмінка** `/admin`: скарги (відхилити / приховати / заблокувати), розблокування,
  оскаржені результати — одиночні та парні (підтвердити / анулювати), черга запропонованих
  клубів. Кожна дія адміна пишеться в `AdminAction` (хто, що, коли, чому).

### Аналітика та моніторинг
- PostHog EU (лише server-side, `lib/analytics/`), Sentry (`instrumentation*.ts`,
  `sentry.*.config.ts`, з очищенням персональних даних `lib/monitoring/scrub-event.ts`),
  UTM-трекінг (`lib/tracking/utm.ts`).

---

## 3. HTTP-ендпоінти (route handlers)

| Метод | Шлях | Доступ | Що робить |
|---|---|---|---|
| `GET` | `/api/cron` | `Authorization: Bearer $CRON_SECRET` (інакше 401) | Автопідтверджує PENDING-результати, у яких минули 72 год — одиночні й парні. Відповідь: `{ autoConfirmed, autoConfirmedDoubles }`. Викликає Vercel Cron щодня о 03:00 UTC (`vercel.json`). |
| `GET` | `/api/cron?job=reminders` | те саме | Часові push-нагадування: за ~3 год до матчу, «як зіграли?» після, нагадування підтвердити результат; також просуває резерв, коли пріоритетна заявка прострочилась. Викликає щогодини GitHub Actions. |
| `GET` | `/auth/callback` | публічний | Обмінює код з magic link / Google (або `token_hash` для OTP) на сесію, створює рядок `users`, якщо його ще нема, і редіректить на `next`. Погане посилання → `/login?error=link`. |

Згенеровані Next.js файли: `/manifest.webmanifest` (`app/manifest.ts`).

---

## 4. Сторінки (маршрути)

🌐 — публічна, 🔒 — потрібен логін, 👤 — потрібен заповнений профіль, 🛡 — адмін, 🏟 — персонал
клубу, 🚩 — за feature flag (зараз вимкнено).

| Шлях | Доступ | Що показує |
|---|---|---|
| `/` | 🌐 | Лендінг: що таке SpinBuddy, клуби на карті, як працює, живі оферти, FAQ |
| `/login` | 🌐 | Вхід: email (magic link + код) або Google |
| `/onboarding` | 🔒 | Первинне заповнення профілю + згода |
| `/consent` | 🔒 | Повторна згода, якщо умови оновились |
| `/offers` | 🌐 | Фід оферт з фільтрами |
| `/offers/[uuid]` | 🌐 | Оферта: деталі; гравцю — його заявка й чат; автору — заявки, кандидати, запрошення, резерв, результат |
| `/offers/new` | 👤 | Форма нової оферти (може бути передзаповнена: клуб, «зіграти ще раз») |
| `/offers/looking` | 👤 | «Шукають гру» — наміри гравців |
| `/offers/today` | 👤 | «Грати сьогодні» |
| `/clubs` | 🌐 | Пошук кортів: список + карта |
| `/clubs/[id]` | 🌐 | Сторінка клубу |
| `/clubs/[id]/book` | 🌐 | Сітка бронювання (запит — лише залогіненим) |
| `/clubs/[id]/chat` | 👤 🚩 | Клубний чат (лише підписникам) |
| `/clubs/suggest` | 🌐 | Форма «запропонувати клуб» (надіслати — 👤) |
| `/club/[clubId]` | 🏟 | Панель персоналу клубу |
| `/players/[id]` | 🌐 | Публічний профіль гравця |
| `/leaderboard` | 🌐 🚩 | Рейтинг |
| `/coaches` | 🌐 🚩 | Тренери |
| `/profile` | 👤 | Мій профіль: майбутні ігри, історія, мої бронювання, налаштування |
| `/profile/edit` | 👤 | Редагування профілю |
| `/profile/preferences` | 👤 | «Коли я люблю грати» |
| `/profile/padel` | 👤 | «Мій падел» |
| `/profile/notifications` | 👤 | Налаштування сповіщень + push on/off |
| `/profile/export` | 👤 | Завантажити мої дані |
| `/profile/delete` | 👤 | Видалити акаунт |
| `/notifications` | 👤 | Список сповіщень (дзвіночок) |
| `/admin` → `/admin/reports`, `/admin/results`, `/admin/club-submissions` | 🛡 | Черги адміна |
| `/install` | 🌐 | Як встановити PWA |
| `/unsubscribe` | 🌐 | Відписка від email за токеном |
| `/terms`, `/privacy` | 🌐 | Умови / політика (поки чернетки) |
| `/account-deleted` | 🌐 | Після видалення акаунта |

`/admin` і `/club/[clubId]` навмисно в публічному списку proxy: і гість, і «не адмін»
отримують однаковий 404 від `requireAdmin` / `requireClubStaff`, щоб не видавати існування сторінки.

---

## 5. Server actions — повний перелік

Server action = функція, яку клієнт викликає як POST-запит. Колонка «Доступ» — яка перевірка
стоїть на початку функції.

### Автентифікація, мова, спорт
| Action | Файл | Доступ | Що робить |
|---|---|---|---|
| `sendMagicLink` | `app/login/actions.ts` | публічний, rate limit 5/год на email | Надсилає лист з magic link і кодом |
| `verifyLoginCode` | `app/login/actions.ts` | публічний | Вхід одноразовим кодом з листа в тій самій вкладці |
| `continueIfSignedIn` | `app/login/actions.ts` | публічний | Якщо користувач уже увійшов в іншій вкладці — редірект далі |
| `signOut` | `app/auth/actions.ts` | — | Вихід лише на цьому пристрої |
| `giveConsent` | `app/consent/actions.ts` | 🔒 | Фіксує згоду з умовами/політикою |
| `setLocale` | `lib/i18n/actions.ts` | публічний | Змінює мову (cookie + `users.locale`) |
| `setSport` | `lib/sport/actions.ts` | публічний | Перемикач Tennis/Padel (cookie `SB_SPORT`) |

### Онбординг і профіль
| Action | Файл | Доступ | Що робить |
|---|---|---|---|
| `completeOnboarding` | `app/onboarding/actions.ts` | 🔒 | Зберігає профіль, ставить стартовий ELO з NTRP. Повторний виклик нічого не перезаписує |
| `updateProfile` | `app/(member)/profile/actions.ts` | 👤 | Редагування профілю; новий NTRP змінює ELO лише до першого підтвердженого матчу |
| `saveAvatar` | там само | 👤 | Записує шлях фото після завантаження в Storage, видаляє старе |
| `updateDiscoverable` | там само | 👤 | Чи показувати мене в «кандидатах» |
| `updatePlayPreferences` | `app/(member)/profile/preferences/actions.ts` | 👤 | Дні/час, коли люблю грати |
| `updatePadelProfile` | `app/(member)/profile/padel/actions.ts` | 👤 | Падел-рівень і сторона; падел-ELO слідує за рівнем до першого результату |
| `submitFeedback` | `app/(member)/profile/feedback-actions.ts` | 👤 | Відгук про суперника після одиночного матчу |
| `exportMyData` | `app/(member)/profile/export/actions.ts` | 👤 | Повертає всі мої дані (JSON) |
| `deleteMyAccount` | `app/(member)/profile/delete/actions.ts` | 👤 | Видаляє акаунт: редагування БД → Storage/Auth → вихід |

### Сповіщення
| Action | Файл | Доступ | Що робить |
|---|---|---|---|
| `unreadNotificationCount` | `app/(member)/notifications/actions.ts` | м'яко (без сесії → 0) | Лічильник для дзвіночка (опитується) |
| `markNotificationsReadAction` | там само | 🔒 | Позначити прочитаними |
| `savePushSubscription` | `app/(member)/profile/notifications/actions.ts` | 🔒 | Зберігає/оновлює push-підписку браузера (upsert за endpoint) |
| `removePushSubscription` | там само | 🔒 | Видаляє свою підписку |
| `updateNotificationSetting` | там само | 🔒 | Перемикає одне з трьох налаштувань |
| `confirmUnsubscribe` | `app/unsubscribe/actions.ts` | підписаний токен | Вимикає email-сповіщення без логіну |

### Оферти: створення, фід, наміри
| Action | Файл | Доступ | Що робить |
|---|---|---|---|
| `createOffer` | `app/(member)/offers/new/actions.ts` | 👤, 10/день | Створює оферту; розсилає «нова оферта для твого рівня» та «улюблений гравець створив гру» |
| `dismissOffer` / `undismissOffer` | `lib/offers/dismissals/actions.ts` | 👤 | Приховати / повернути оферту у фіді |
| `postPlayIntent` | `app/offers/looking/actions.ts` | 👤, 10/день | Публікує/замінює намір «хочу зіграти» на дату |
| `trackPlayTodayViewed`, `trackPlayTodayResultSelected`, `trackPlayTodayEmptyState` | `app/offers/today/actions.ts` | — | Аналітика сторінки «Грати сьогодні» |
| `trackCandidatesViewed` | `app/offers/[id]/candidates-actions.ts` | — | Аналітика переглядів кандидатів |

### Оферта: заявки, чат, статус (`app/offers/[id]/actions.ts`)
| Action | Доступ | Що робить |
|---|---|---|
| `requestToJoin` | 👤, 20/день | Заявка на участь (перевірки: рівень, стать, блокування, повтор) |
| `acceptJoin` / `declineJoin` | 👤 автор | Прийняти / відхилити заявку; при заповненні оферта стає FULL |
| `withdrawJoin` | 👤 гравець | Відкликати свою заявку; звільнене місце йде першому з резерву |
| `cancelOffer` | 👤 автор | Скасувати оферту (пізнє скасування <12 год рахується в надійності) |
| `sendMessage` | 👤 учасник, 60/10 хв | Повідомлення в приватному чаті заявки |
| `markCourtBooked` | 👤 автор | Позначити «корт заброньовано» + сповіщення |

### Оферта: запрошення, резерв, улюблені
| Action | Файл | Доступ | Що робить |
|---|---|---|---|
| `inviteToOffer` | `invite-actions.ts` | 👤 автор, 10/год | Запросити конкретного гравця |
| `acceptInvite` / `declineInvite` | `invite-actions.ts` | 👤 запрошений | Прийняти (одразу ACCEPTED-місце) / відхилити |
| `inviteFavorites` | `favorite-actions.ts` | 👤 автор | Запросити всіх улюблених (у межах того ж ліміту) |
| `createInviteLink` / `revokeInviteLink` | `invite-link-actions.ts` | 👤 автор | Увімкнути / відкликати секретне посилання |
| `joinByInviteLink` | `invite-link-actions.ts` | 👤 | Зайняти місце за посиланням |
| `joinWaitlist` / `leaveWaitlist` | `waitlist-actions.ts` | 👤 | Стати в резерв / вийти з нього |

### Оферта: результати
| Action | Файл | Доступ | Що робить |
|---|---|---|---|
| `submitResult` | `result-actions.ts` | 👤 сторона матчу | Подати рахунок одиночного матчу (один раз) |
| `submitNoShow` | `result-actions.ts` | 👤 сторона матчу | «Суперник не прийшов» |
| `confirmResult` | `result-actions.ts` | 👤 інша сторона | Підтвердити → застосовується ELO / лічильник неявок |
| `disputeResult` | `result-actions.ts` | 👤 інша сторона | Оскаржити → йде в адмінку |
| `submitDoublesResult` | `doubles-result-actions.ts` | 👤 гравець гри | Рахунок парної гри + хто грав з автором |
| `submitDoublesNoShow` | `doubles-result-actions.ts` | 👤 гравець гри | Хтось із четвірки не прийшов |
| `confirmDoublesResult` / `disputeDoublesResult` | `doubles-result-actions.ts` | 👤 інша пара (або названий гравець) | Підтвердити / оскаржити |
| `rateDoublesPlayer` | `doubles-result-actions.ts` | 👤 гравець гри | Теги-відгук про іншого гравця після парної гри |

### Скарги та блокування
| Action | Файл | Доступ | Що робить |
|---|---|---|---|
| `reportOffer` / `reportMessage` | `app/offers/[id]/report-actions.ts` | 👤, 10/день | Скарга на оферту / повідомлення (може спрацювати автоблок) |
| `reportPlayer` | `app/players/[id]/actions.ts` | 👤, 10/день | Скарга на гравця |
| `blockPlayer` / `unblockPlayer` | `app/players/[id]/actions.ts` | 👤 | Особисте блокування |
| `addFavorite` / `removeFavorite` | `app/players/[id]/actions.ts` | 👤 | Список улюблених (макс. 20, гравцю не повідомляється) |

### Клуби
| Action | Файл | Доступ | Що робить |
|---|---|---|---|
| `recordOutboundClick` | `app/clubs/actions.ts` | публічний, ніколи не кидає помилку | Логує клік на «забронювати»/телефон клубу |
| `submitClub` | `app/clubs/suggest/actions.ts` | 👤, 3/день | Пропозиція нового клубу (PENDING) |
| `requestBooking` | `app/clubs/[id]/book/actions.ts` | 👤, 10/день, не більше 3 запитів у статусі PENDING | Запит на бронювання слоту (перевірка вільності + EXCLUDE-обмеження в БД) |
| `cancelBooking` | `app/clubs/[id]/book/actions.ts` | 👤 власник броні | Скасувати свою бронь (не пізніше 12 год); CONFIRMED → сповіщення персоналу |
| `followClub` / `unfollowClub` | `app/clubs/[id]/follow-actions.ts` | 👤 🚩 | Підписка на клуб |
| `sendClubMessage` | `app/clubs/[id]/chat-actions.ts` | 👤 підписник 🚩 | Повідомлення в клубному чаті |
| `reportClubMessage` | `app/clubs/[id]/chat-actions.ts` | 👤 підписник 🚩 | Скарга на повідомлення в клубному чаті |

### Панель клубу (`app/(club)/club/[clubId]/`)
| Action | Файл | Доступ | Що робить |
|---|---|---|---|
| `confirmBooking` | `actions.ts` | 🏟 | Підтвердити запит на бронювання |
| `declineBooking` | `actions.ts` | 🏟 | Відхилити (з необов'язковою причиною для гравця) |
| `addBlock` | `actions.ts` | 🏟 | Заблокувати слот (бронь поза SpinBuddy, ремонт); не можна поверх активної броні |
| `removeBlock` | `actions.ts` | 🏟 | Зняти блок |
| `postClubEvent` / `deleteClubEvent` | `event-actions.ts` | 🏟 🚩 | Новини клубу для підписників |

### Адмінка
| Action | Файл | Доступ | Що робить |
|---|---|---|---|
| `dismissReport` | `app/admin/actions.ts` | 🛡 | Відхилити скаргу |
| `hideReport` | там само | 🛡 | Приховати предмет скарги: скасувати оферту / замінити повідомлення на «[removed]» |
| `blockFromReport` | там само | 🛡 | Заблокувати гравця за скаргою |
| `unblockPlayer` | там само | 🛡 | Розблокувати гравця |
| `confirmDisputedResult` / `annulDisputedResult` | там само | 🛡 | Оскаржений одиночний результат: застосувати / анулювати |
| `confirmDisputedDoublesResult` / `annulDisputedDoublesResult` | там само | 🛡 | Те саме для парних |
| `approveSubmission` / `rejectSubmission` | `app/admin/club-submissions/actions.ts` | 🛡 | Схвалити / відхилити запропонований клуб |

---

## 6. Обмеження частоти (rate limits)

| Дія | Ліміт | Ключ |
|---|---|---|
| Нова оферта | 10 / день | userId |
| Заявка на участь | 20 / день | userId |
| Повідомлення в чаті | 60 / 10 хв | userId |
| Скарга | 10 / день | userId |
| Magic link | 5 / год | email |
| Запит на бронювання | 10 / день | userId |
| Пропозиція клубу | 3 / день | userId |
| Запрошення в гру | 10 / год | userId |
| Намір «хочу зіграти» | 10 / день | userId |

Фіксоване вікно (не ковзне), лічильник у таблиці `RateLimitCounter`.

---

## 7. Модель даних (Prisma, `prisma/schema.prisma`)

| Група | Моделі |
|---|---|
| Користувачі | `User` (профіль, ELO теніс/падел, лічильники надійності, `isAdmin`, `locale`), `PushSubscription`, `UserBlock`, `PlayerFavorite` |
| Клуби | `Club` (`bookingMode`), `Court`, `CourtHours`, `ClubStaff` (OWNER/STAFF), `ClubSubmission`, `ClubFollow`, `ClubEvent`, `Coach` |
| Бронювання | `Booking` (PENDING/CONFIRMED/DECLINED/CANCELLED), `CourtBlock` |
| Оферти | `SparringOffer` (OPEN/FULL/CANCELLED, sport, format, matchGender, visibility, inviteToken), `OfferJoin` (REQUESTED/ACCEPTED/DECLINED/WITHDRAWN), `OfferInvite`, `OfferWaitlist`, `OfferDismissal`, `PlayIntent` |
| Спілкування | `Message` (TEXT/SYSTEM; і для чату заявки, і для клубного), `Notification` |
| Результати | `MatchResult` (PENDING/CONFIRMED/DISPUTED/NO_SHOW/ANNULLED), `DoublesResult`, `MatchFeedback` |
| Модерація | `Report`, `AdminAction` |
| Службові | `OutboundClick`, `RateLimitCounter` |

Частина правил живе в самій БД: RLS-політики, CHECK-обмеження (шкала NTRP), EXCLUDE-обмеження
(бронювання не перетинаються). Перевіряються інтеграційними тестами `pnpm test:integration`.

---

## 8. Де шукати логіку (`lib/`)

| Папка | Про що |
|---|---|
| `lib/auth/` | `requireUser`, `requireOnboardedUser`, `requireAdmin`, `requireClubStaff`, публічні маршрути, callback |
| `lib/offers/` | Правила заявок, скасувань, запрошень, резерву, результатів; фід, «Грати сьогодні», наміри |
| `lib/rating/` | ELO (одиночний і парний), стартовий ELO, надійність, автопідтвердження |
| `lib/matching/` | Кандидати, ранжування за ELO, кому розсилати «нова оферта для рівня» |
| `lib/booking/` | Сітка доступності, тривалість, правила скасування, дані панелі клубу |
| `lib/notifications/` | `notify()`, нагадування для cron, токен відписки |
| `lib/push/`, `lib/email/` | Web Push і Resend |
| `lib/moderation/` | Скарги, автоблок, особисті блокування |
| `lib/feedback/`, `lib/achievements/` | Відгуки, бейджі, сигнал рівня, досягнення |
| `lib/privacy/`, `lib/legal/` | Експорт/видалення даних, згода |
| `lib/validation/` | Усі Zod-схеми |
| `lib/clubs/`, `lib/coaches/`, `lib/players/`, `lib/leaderboard/` | Читання даних для відповідних сторінок |
| `lib/features.ts` | Feature flags |
| `lib/rate-limit/` | Ліміти частоти |

Пара важливих «чистих» функцій — правила (`*-rules.ts`) винесені окремо від actions, щоб
кожне правило мало юніт-тест у `tests/lib/…`.
