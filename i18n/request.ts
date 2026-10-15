import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

import { DEFAULT_LOCALE, isAppLocale, LOCALE_COOKIE } from "@/lib/i18n/locale";
import en from "@/messages/en.json";
import pl from "@/messages/pl.json";

// Both catalogs are tiny and always needed server-side, so a static map
// (not a dynamic `import(...${locale}.json)`) — that also keeps the
// messages fully typed instead of widening to `any`.
const MESSAGES = { en, pl };

// Cookie-only setup (decision 2026-10-15 "Польська мова"): no `[locale]`
// route segment, so the active language is whatever the proxy (proxy.ts)
// already wrote to the NEXT_LOCALE cookie. The `?? DEFAULT_LOCALE` fallback
// only matters when something reads this outside the proxy's reach (e.g. a
// unit test).
export default getRequestConfig(async () => {
  const cookieLocale = (await cookies()).get(LOCALE_COOKIE)?.value;
  const locale = isAppLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;

  return {
    locale,
    // Every date/time on the site is in Kraków time regardless of language
    // (task 1.20's DoD) — the formatter still speaks the active locale.
    timeZone: "Europe/Warsaw",
    messages: MESSAGES[locale],
  };
});
