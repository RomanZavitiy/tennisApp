"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { cn } from "cn";

import { setLocale } from "@/lib/i18n/actions";
import { LOCALES, type AppLocale } from "@/lib/i18n/locale";

// Task 1.20: switches the NEXT_LOCALE cookie (what every page reads) and,
// for a signed-in player, the saved locale on their profile (what e-mail
// and push read). Rendered in the footer and on /profile — same component,
// setLocale() quietly skips the profile write when nobody is signed in.
export function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations("LanguageSwitcher");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function choose(next: AppLocale) {
    if (next === locale || isPending) return;
    startTransition(async () => {
      await setLocale(next);
      router.refresh();
    });
  }

  return (
    <div
      role="group"
      aria-label={t("label")}
      className="inline-flex items-center gap-1"
    >
      {LOCALES.map((option) => (
        <button
          key={option}
          type="button"
          disabled={isPending}
          aria-pressed={option === locale}
          onClick={() => {
            choose(option);
          }}
          className={cn(
            "rounded-md px-2 py-1 text-sm font-medium disabled:opacity-50",
            option === locale
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {t(`names.${option}`)}
        </button>
      ))}
    </div>
  );
}
