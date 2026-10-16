# Чекліст запуску — MatchFinder Kraków

Покроковий список для людини: усе, що код не може зробити сам (сторонні акаунти, DNS, секрети,
ручні команди). Відмічай пункти по ходу; кожен має «Як перевірити». Контекст і рішення —
`.agents/decisions.md`; код, що вже готовий чекати на ці секрети — `docs/PLANNING.md`, слайс J.

## 1. Домен і листи (5.13 → 1.19)

1. Купити/підключити домен (якщо ще немає).
2. Додати домен у Resend (dashboard.resend.com → Domains → Add Domain), додати DNS-записи
   (SPF/DKIM/DMARC), які Resend покаже, у DNS-провайдера домену.
3. Дочекатись статусу «Verified» у Resend (може зайняти до кількох годин — DNS-пропагація).
4. У `lib/email/send.ts` замінити `FROM_ADDRESS = "MatchFinder Kraków <onboarding@resend.dev>"`
   на адресу з верифікованого домену (напр. `no-reply@твійдомен.pl`) — окремий маленький PR,
   не ця сесія, бо домену ще нема.
5. Supabase Dashboard → Authentication → Settings → SMTP Settings: увімкнути "Custom SMTP",
   заповнити хостом/портом/ключем Resend (Resend → SMTP, окремий API-ключ з правами send-only).
   Це замінює листи Supabase (magic link тощо) на відправку через Resend з верифікованого
   домену — зараз вони йдуть зі стандартної Supabase-адреси.

**Як перевірити:** надісланий лист (magic link на `/login`) приходить з адреси на твоєму
домені, не з `resend.dev` чи `supabase.io`.

## 2. PostHog (6.5, 6.6)

1. posthog.com → New project, регіон **EU** (не US — рішення 2026-10-14).
2. Project Settings → API Keys → Project API Key.
3. Vercel (Preview **і** Production) → `POSTHOG_KEY` = цей ключ. `POSTHOG_HOST` можна не
   додавати — код сам використовує EU-хост за замовчуванням (`.env.example`).
4. Локально: та сама змінна в `.env.local`, якщо хочеш бачити події під час розробки.

**Як перевірити:** зроби будь-яку подію (напр. створи оферту) → PostHog → Activity — подія
`offer_created` з'являється протягом секунд, без email/імені у властивостях.

## 3. Sentry (6.19)

1. sentry.com → New project → платформа **Next.js**, безкоштовний план (рішення 2026-10-14).
2. Project Settings → Client Keys (DSN) → скопіювати DSN.
3. Vercel (Preview і Production):
   - `SENTRY_DSN` і `NEXT_PUBLIC_SENTRY_DSN` = той самий DSN.
   - `SENTRY_ORG`, `SENTRY_PROJECT` = слаги з URL дашборду Sentry.
   - `SENTRY_AUTH_TOKEN` — Settings → Auth Tokens → створити з правом `project:releases`; лише
     для білду (сорс-мепи), не читається рантаймом.
4. Локально (`.env.local`): той самий `SENTRY_DSN`/`NEXT_PUBLIC_SENTRY_DSN`, якщо хочеш бачити
   помилки під час розробки — необов'язково.

**Як перевірити (навмисна тестова помилка на preview):**
1. Відкрити будь-яку сторінку preview-деплою з доданим DSN.
2. У браузерній консолі на цій сторінці виконати `throw new Error("sentry test")`
   (або тимчасово додати кнопку/код, що кидає помилку, і натиснути) — перевіряє клієнтський
   `instrumentation-client.ts`.
3. Для серверної частини: будь-яка вже наявна помилка в server action чи сторінці (напр.
   тимчасово зіпсований запит) спрацює через `instrumentation.ts`/`sentry.server.config.ts`.
4. Sentry → Issues — обидві помилки з'являються протягом хвилини, без email/cookie
   у вкладці Request (перевіряє `lib/monitoring/scrub-event.ts`).
5. Прибрати тестовий код перед тим, як лишити preview для реальних людей.

## 4. Другий проєкт Supabase: staging і production (6.9, 6.10)

1. supabase.com → New project (регіон `eu-west-1`, як і зараз) — це стане **production**.
   Існуючий проєкт стає **staging** (Preview).
2. `pnpm prisma migrate deploy` проти нового prod-проєкту (`DATABASE_URL`/`DIRECT_URL`
   тимчасово в терміналі, не в `.env.local`) — створює всі таблиці з нуля. Детальний процес і
   чому він ручний — `.agents/decisions.md`, запис 2026-10-16 «Застосування міграцій до prod».
3. Supabase Storage (prod): створити бакет `avatars` з тими самими policies, що в staging
   (Dashboard → Storage → Policies, скопіювати вручну або `supabase db dump` і застосувати).
4. Vercel: перенести окремі значення `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` для Production на новий prod-проєкт; Preview лишає
   поточні (staging) значення. Повна таблиця — `README.md`, розділ «Середовища».
5. Призначити собі роль адміна в **prod**-БД (SQL, той самий запит, що й у staging — деталі в
   PR слайсу I, `decisions.md` 2026-10-15).

**Як перевірити:** `pnpm prisma migrate status` проти prod-БД → «Database schema is up to
date!». Відкрити Production-деплой, зареєструватись тестовим акаунтом — профіль і дані не
перетинаються з тим, що бачить staging/preview.

## 5. Тексти Regulamin і Privacy Policy (6.11, 6.12)

1. `/terms` і `/privacy` зараз показують Draft-банер і один абзац-заповнювач
   (`app/terms/page.tsx`, `app/privacy/page.tsx`, `messages/en.json`/`pl.json`, ключі
   `TermsPage`/`PrivacyPage`). Передати юристу/людині для написання реального тексту (EN і PL).
2. Коли текст готовий: замінити `placeholder`-рядки в обох `messages/*.json` реальним текстом,
   прибрати `draftNotice`-банер (або саму умову показу в коді).
3. Підняти `CURRENT_CONSENT_VERSION` у `lib/legal/consent.ts` на нову дату — це і новим, і
   наявним користувачам покаже екран згоди ще раз для оновленого тексту.

**Як перевірити:** `/terms` і `/privacy` без банера «Draft»; наявний тестовий акаунт при
наступному вході бачить `/consent` (бо версія змінилась).

## 6. День запуску

1. **Бекап:** Supabase (prod) → Database → Backups — підтвердити, що є свіжий автоматичний
   бекап (безкоштовний план Supabase робить щоденні; за потреби — ручний `pg_dump` перед самим
   запуском).
2. **Перший `migrate deploy`:** якщо з кроку 4 минув час і накопичились нові міграції —
   `pnpm prisma migrate status` проти prod, потім `pnpm prisma migrate deploy`, перш ніж
   анонсувати запуск.
3. **Смоук-тест 4 флоу на prod** (ті самі, що покриває e2e, AGENTS.md §7 — тут вручну, у
   браузері, на справжньому production-URL):
   - Вхід → онбординг (включно з новим чекбоксом згоди).
   - Створити оферту → побачити її у стрічці.
   - Заявка на оферту → прийняття → повідомлення в чаті.
   - Результат матчу → підтвердження суперником → зміна ELO в обох профілях.
4. Перевірити Sentry і PostHog дашборди — події зі смоук-тесту там з'явились.
5. Анонсувати.

## Підсумок — чого не вистачало на старті цієї сесії

Перевірено `.env.local` на початку (2026-10-16): жодного з наведених нижче секретів/сервісів
не було, тому код у цій сесії додано в режимі «мовчки нічого не шле без ключа» (той самий
патерн, що вже в `lib/push/send-push.ts`), а не з живою інтеграцією:

- Домен і верифікація Resend (розділ 1).
- `POSTHOG_KEY` (розділ 2).
- `SENTRY_DSN`/`SENTRY_ORG`/`SENTRY_PROJECT`/`SENTRY_AUTH_TOKEN` (розділ 3).
- Другий проєкт Supabase (розділ 4).
- Тексти Regulamin/Privacy (розділ 5) — сторінки є, текст — ні.

Усе інше зі слайсу J (аналітика, Sentry-код, експорт даних, легал-сторінки й згода, мапінг
env у README) — зроблено в коді цієї сесії і не потребує додаткових дій, крім пунктів вище.
