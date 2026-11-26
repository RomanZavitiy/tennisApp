"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useEffect, useSyncExternalStore } from "react";

import { type AppLocale, isAppLocale, LOCALE_COOKIE } from "@/lib/i18n/locale";

import "./globals.css";

// The last-resort screen for an error in the root layout itself (header,
// footer, the translations provider), which app/error.tsx can't catch
// because it renders inside that layout. It replaces <html> entirely, so
// there is no next-intl provider here: the four lines are kept inline
// (same wording as ErrorPage in messages/*.json) instead of shipping both
// full catalogs in the client bundle for a screen that should never show.
const COPY: Record<
  AppLocale,
  { title: string; body: string; retry: string; home: string }
> = {
  en: {
    title: "Something went wrong",
    body: "SpinBuddy didn't load. Try again in a moment.",
    retry: "Try again",
    home: "Back to home",
  },
  pl: {
    title: "Coś poszło nie tak",
    body: "Nie udało się wczytać SpinBuddy. Spróbuj ponownie za chwilę.",
    retry: "Spróbuj ponownie",
    home: "Wróć na stronę główną",
  },
};

function noSubscription() {
  return () => {};
}

function cookieLocale(): AppLocale {
  const value = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${LOCALE_COOKIE}=`))
    ?.split("=")[1];
  return isAppLocale(value) ? value : "en";
}

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  // The cookie never changes while this screen is up: nothing to subscribe
  // to. English on the server, the player's language once in the browser.
  const locale = useSyncExternalStore(
    noSubscription,
    cookieLocale,
    () => "en" as const,
  );
  const copy = COPY[locale];

  useEffect(() => {
    // Same rule as app/error.tsx: errors with a digest came from the server
    // and already reached Sentry through instrumentation.ts.
    if (!error.digest) {
      Sentry.captureException(error);
    }
  }, [error]);

  return (
    <html lang={locale}>
      <body className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground antialiased">
        <main className="surface w-full max-w-md p-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">{copy.title}</h1>
          <p className="mt-3 text-sm text-muted-foreground">{copy.body}</p>
          <div className="mt-6 flex justify-center gap-2">
            <button
              type="button"
              onClick={retry}
              className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
            >
              {copy.retry}
            </button>
            <Link
              href="/"
              className="rounded-full border px-5 py-2 text-sm font-semibold"
            >
              {copy.home}
            </Link>
          </div>
          {error.digest && (
            <p className="mt-6 font-mono text-xs text-muted-foreground">
              {error.digest}
            </p>
          )}
        </main>
      </body>
    </html>
  );
}
