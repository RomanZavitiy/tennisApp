# Видалення акаунта — ручний процес (резервний шлях, задача 6.15)

**Оновлення (2026-10-16, пізніше того ж дня): самообслуговування тепер є.** Гравець видаляє
свій акаунт сам, кнопкою `/profile/delete` (`lib/privacy/delete-account.ts`,
`app/(member)/profile/delete/actions.ts`) — код робить рівно те, що описано нижче. Цей документ
лишається як резервний шлях: (а) дозаписати кроки 5-6 вручну, якщо
`deleteAccountStorageAndAuth` впаде вже після того, як транзакція з кроків 1-4 закомічена,
(б) видалення без сесії гравця — для цього немає окремого UI. Деталі рішення — `decisions.md`,
запис «Видалення акаунта: self-service кнопка замінює ручний процес».

Усе нижче лишається чинним описом того, що відбувається, і резервним ручним шляхом. Політика
видалення (що саме стирається, що лишається) — рішення 2026-10-14 «Видалення акаунта», без змін.

Усе нижче — SQL у Supabase SQL Editor (Dashboard → SQL Editor) плюс два кроки в Dashboard UI.
Жодна з команд не чіпає `match_results` чи ELO — підтверджені матчі й рейтинг суперників
лишаються недоторканими (узгоджено з `Restrict` на `match_results.offer_join_id`, рішення
2026-09-28).

**Чому це безпечно без коду:** компоненти вже скрізь показують запасний текст, коли `name`
порожній — `offer.author.name && (...)` (`components/offer-card.tsx`), `match.opponentName ??
t("aPlayer")` (`components/match-history.tsx`), `offer.author.name ?? t("defaultAuthorName")`
(`app/offers/[id]/page.tsx`) і так далі. `getPublicProfile()` (`lib/players/public-profile.ts`)
вимагає `name`/`birthDate`/`district`/`selfRatedNtrp`/`elo` не-null і інакше повертає `null` →
сторінка `/players/[id]` сама віддає 404 (`notFound()`). Тобто нулювання потрібних полів нижче
автоматично дає і «профіль 404», і «Deleted player»-подібний вигляд всюди — без жодної зміни в
коді.

## Кроки

Підстав реальний `user_id` замість `<user_id>` у кожному запиті (знайти його — крок 0).

### 0. Знайти користувача і його фото

```sql
select id, email, avatar_path
from users
where email = '<email гравця>';
```

Запиши `id` (знадобиться в кожному наступному запиті) і `avatar_path` (знадобиться в кроці 5,
якщо не `null`).

### 1. Скасувати відкриті оферти автора

```sql
update sparring_offers
set status = 'CANCELLED'
where author_id = '<user_id>'
  and status in ('OPEN', 'FULL');
```

### 2. Відкликати живі заявки гравця — крім тих, що вже зіграні

Заявка з результатом матчу (`match_results`) лишається як є — вона вже відбулась, і статус
«WITHDRAWN» для зіграного матчу не має сенсу; торкаємось лише того, що ще не відбулось.

```sql
update offer_joins
set status = 'WITHDRAWN'
where user_id = '<user_id>'
  and status in ('REQUESTED', 'ACCEPTED')
  and id not in (select offer_join_id from match_results);
```

### 3. Замінити текст повідомлень гравця на «[deleted]»

```sql
update messages
set content = '[deleted]'
where sender_id = '<user_id>';
```

### 4. Стерти персональні поля профілю

```sql
update users
set name = null,
    email = null,
    birth_date = null,
    avatar_path = null
where id = '<user_id>';
```

Усе інше (елo, лічильники надійності, налаштування сповіщень, мова) лишається — це не
персональні дані, і `match_results` зі своїми власними ELO-знімками не залежить від полів
`users` узагалі.

### 5. Видалити фото зі Storage (лише якщо крок 0 показав `avatar_path`)

Dashboard → Storage → бакет `avatars` → відкрити папку `<user_id>/` → вибрати всі файли →
Delete.

### 6. Видалити акаунт автентифікації

Dashboard → Authentication → Users → знайти за email із кроку 0 → **Delete user**.

Це прибирає сам запис у `auth.users` — без нього гравець більше не може увійти. Рядок у
`public.users` не має зовнішнього ключа на `auth.users` (рішення 1.2), тож видалення нічого
там не каскадить — саме тому крок 4 і це можна робити в будь-якому порядку.

## Перевірка після виконання

- `/players/<user_id>` (в браузері) → 404.
- Вхід тим самим email неможливий (посилання/код більше не приходять на валідний акаунт).
- Сторінка будь-якого спільного матчу (сторінка оферти чи `/players/<opponent_id>`'s історія)
  досі показує рахунок і ELO-зміну суперника — лише ім'я видаленого гравця замінене на «A
  player»/«Zawodnik» чи просто сховане, залежно від місця.
- Чат-тред, де писав видалений гравець, показує «[deleted]» на місці його повідомлень.
