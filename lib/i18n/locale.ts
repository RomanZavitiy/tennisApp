// Supported UI languages (task 1.20, decision 2026-10-15 "Польська мова").
// Ukrainian comes after launch. No `[locale]` route segment: the active
// language always comes from this cookie, read directly in i18n/request.ts
// — see the decision for why.
export const LOCALES = ["en", "pl"] as const;
export type AppLocale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: AppLocale = "en";
export const LOCALE_COOKIE = "NEXT_LOCALE";
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isAppLocale(
  value: string | null | undefined,
): value is AppLocale {
  return value != null && (LOCALES as readonly string[]).includes(value);
}

/**
 * First supported language in a browser's `Accept-Language` header, else
 * the default. Used only once, by the proxy, the first time a visitor
 * arrives with no `NEXT_LOCALE` cookie yet.
 */
export function localeFromAcceptLanguage(header: string | null): AppLocale {
  if (!header) return DEFAULT_LOCALE;
  for (const tag of header.split(",")) {
    const lang = tag.split(";")[0]?.trim().slice(0, 2).toLowerCase();
    if (isAppLocale(lang)) return lang;
  }
  return DEFAULT_LOCALE;
}
