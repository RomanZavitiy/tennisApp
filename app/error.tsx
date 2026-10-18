"use client";

import * as Sentry from "@sentry/nextjs";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect } from "react";

import { Button, buttonVariants } from "@/components/ui/button";

// Replaces Next.js's bare "This page couldn't load" screen for any error
// thrown below the root layout — a page render or a server action — so the
// header stays and the player gets a translated way out. Server errors
// already reach Sentry through instrumentation.ts's onRequestError and
// arrive here with a `digest`; only browser-side ones are reported from
// here, so nothing is counted twice.
export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const t = useTranslations("ErrorPage");

  useEffect(() => {
    if (!error.digest) {
      Sentry.captureException(error);
    }
  }, [error]);

  return (
    <main className="mx-auto w-full max-w-sm flex-1 px-4 py-10 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="mt-3 text-sm text-muted-foreground">{t("body")}</p>
      <div className="mt-6 flex justify-center gap-2">
        <Button type="button" onClick={retry}>
          {t("retry")}
        </Button>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          {t("home")}
        </Link>
      </div>
      {error.digest && (
        <p className="mt-6 font-mono text-xs text-muted-foreground">
          {t("reference", { digest: error.digest })}
        </p>
      )}
    </main>
  );
}
