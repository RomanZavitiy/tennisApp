"use server";

import { cookies } from "next/headers";

import { getCurrentUser } from "@/lib/auth/require-user";
import { db } from "@/lib/db";
import {
  isAppLocale,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
} from "@/lib/i18n/locale";

// Called by the language switcher (footer, profile — task 1.20). Always sets
// the cookie, which is what every page actually reads (decision 2026-10-15,
// "Польська мова"); also updates the signed-in user's row, read only by
// e-mail and push, never by the page render itself.
export async function setLocale(locale: unknown): Promise<void> {
  if (typeof locale !== "string" || !isAppLocale(locale)) {
    return;
  }

  (await cookies()).set(LOCALE_COOKIE, locale, {
    maxAge: LOCALE_COOKIE_MAX_AGE,
    sameSite: "lax",
    path: "/",
  });

  const user = await getCurrentUser();
  if (user) {
    await db.user.update({
      where: { id: user.id },
      data: { locale: locale === "pl" ? "PL" : "EN" },
    });
  }
}
