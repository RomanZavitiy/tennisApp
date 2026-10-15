import { NextResponse, type NextRequest } from "next/server";

import { isPublicRoute } from "@/lib/auth/routes";
import {
  isAppLocale,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  localeFromAcceptLanguage,
} from "@/lib/i18n/locale";
import { updateSession } from "@/lib/supabase/proxy";

// Runs before every page: keeps the session fresh, picks a UI language the
// first time a visitor arrives, and sends signed-out users from protected
// pages to /login?next=<where they were going>.
// This guards pages only. Server actions are separate POST endpoints and must
// check the user themselves (requireUser, task 1.5).
export async function proxy(request: NextRequest) {
  // Task 1.20: no NEXT_LOCALE cookie yet means a first visit — read the
  // browser's language once and remember it. After that, the cookie always
  // wins; the switcher (footer/profile) is the only other writer.
  const existingLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale = isAppLocale(existingLocale)
    ? existingLocale
    : localeFromAcceptLanguage(request.headers.get("accept-language"));
  if (!isAppLocale(existingLocale)) {
    // Set on the request too, not just the response: i18n/request.ts reads
    // cookies() during this same request's render, before the browser gets
    // the response's Set-Cookie.
    request.cookies.set(LOCALE_COOKIE, locale);
  }

  const { response, isSignedIn } = await updateSession(request);
  if (!isAppLocale(existingLocale)) {
    response.cookies.set(LOCALE_COOKIE, locale, {
      maxAge: LOCALE_COOKIE_MAX_AGE,
      sameSite: "lax",
      path: "/",
    });
  }
  const { pathname, search } = request.nextUrl;

  if (isSignedIn || isPublicRoute(pathname)) {
    return response;
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", pathname + search);
  const redirect = NextResponse.redirect(loginUrl);
  for (const cookie of response.cookies.getAll()) {
    redirect.cookies.set(cookie);
  }
  return redirect;
}

export const config = {
  matcher: [
    // Skip Next.js internals and static files: they need no session, and
    // redirecting them would break CSS, JS and images on public pages.
    // js/webmanifest (task 5.14): the service worker (public/sw.js) and the
    // generated manifest (app/manifest.ts) both have to load before anyone
    // has signed in, to install the app at all.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|js|webmanifest)$).*)",
  ],
};
