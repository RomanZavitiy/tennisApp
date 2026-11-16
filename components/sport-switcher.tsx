"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import type { Sport } from "@/lib/generated/prisma/enums";
import { setSport } from "@/lib/sport/actions";
import { SPORTS } from "@/lib/sport/sport";
import { cn } from "@/lib/utils";

// Tennis or padel (slice PD1): sets the SB_SPORT cookie every list reads
// (offers, clubs, the offer form), then re-renders the page in place. In
// the header on every screen size — unlike the language, the sport changes
// what the whole page shows, so it can't hide in the footer.
export function SportSwitcher({ sport }: { sport: Sport }) {
  const t = useTranslations("SportSwitcher");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function choose(next: Sport) {
    if (next === sport || isPending) return;
    startTransition(async () => {
      await setSport(next);
      router.refresh();
    });
  }

  return (
    <div
      role="group"
      aria-label={t("label")}
      className="inline-flex items-center rounded-full border bg-muted p-0.5"
    >
      {SPORTS.map((option) => (
        <button
          key={option}
          type="button"
          disabled={isPending}
          aria-pressed={option === sport}
          onClick={() => {
            choose(option);
          }}
          className={cn(
            "cursor-pointer rounded-full px-2.5 py-1 text-xs font-bold transition-colors disabled:opacity-50 sm:px-3 sm:text-sm",
            option === sport
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {t(`names.${option}`)}
        </button>
      ))}
    </div>
  );
}
