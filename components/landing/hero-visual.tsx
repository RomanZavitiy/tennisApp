import { MapPinIcon, TrendingUpIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { CourtLines } from "@/components/court-lines";
import { Float } from "@/components/landing/motion";

// The hero's picture (redesign): a green court panel with three floating
// cards that show what the product does — an offer, a rating that moved, a
// club on the map. An illustration with sample content, hidden from
// assistive tech; the real things are one click away.
export function HeroVisual() {
  const t = useTranslations("LandingPage.mock");

  return (
    <div aria-hidden className="relative mx-auto w-full max-w-lg lg:max-w-none">
      <div className="relative aspect-[5/6] overflow-hidden rounded-[2rem] bg-primary shadow-md sm:aspect-[4/3] lg:aspect-[5/6]">
        <div className="absolute inset-0 bg-[radial-gradient(34rem_22rem_at_100%_0%,color-mix(in_oklch,var(--highlight)_50%,transparent),transparent_70%)]" />
        <CourtLines className="absolute top-1/2 left-1/2 h-[125%] -translate-x-1/2 -translate-y-1/2 rotate-[24deg] text-primary-foreground/20" />
        {/* The ball. */}
        <div className="absolute top-[16%] right-[18%] size-10 rounded-full bg-highlight shadow-[0_10px_30px_-6px_oklch(0.2_0.05_155/0.6)]" />
      </div>

      <Float className="absolute top-[12%] -left-2 w-[78%] sm:-left-6 sm:w-[62%] lg:-left-10 lg:w-[80%]">
        <div className="surface p-4">
          <div className="flex items-start gap-3">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
              {t("offerInitials")}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate font-semibold">{t("offerTime")}</span>
                <span className="shrink-0 rounded-full bg-highlight px-2 py-0.5 text-xs font-semibold text-highlight-foreground">
                  {t("offerSpots")}
                </span>
              </div>
              <p className="mt-0.5 truncate text-sm text-muted-foreground">
                {t("offerMeta")}
              </p>
            </div>
          </div>
          <div className="mt-3 flex h-8 items-center justify-center rounded-full bg-primary text-[0.8125rem] font-semibold text-primary-foreground">
            {t("offerAction")}
          </div>
        </div>
      </Float>

      <Float
        delay={1.5}
        className="absolute top-[52%] -right-2 w-[52%] sm:-right-6 sm:w-[40%] lg:-right-6 lg:w-[54%]"
      >
        <div className="surface p-4">
          <p className="text-xs font-medium text-muted-foreground">
            {t("ratingLabel")}
          </p>
          <div className="mt-1 flex items-center gap-2">
            <span className="font-heading text-3xl font-bold tracking-tight tabular-nums">
              1532
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-secondary-foreground">
              <TrendingUpIcon className="size-3" />
              +18
            </span>
          </div>
          <div className="mt-3 flex h-8 items-end gap-1">
            {[35, 50, 42, 60, 55, 78, 100].map((height, index) => (
              <span
                key={index}
                style={{ height: `${String(height)}%` }}
                className="flex-1 rounded-sm bg-primary/25 last:bg-primary"
              />
            ))}
          </div>
        </div>
      </Float>

      <Float
        delay={3}
        className="absolute bottom-[6%] left-[6%] w-[64%] sm:w-[46%] lg:w-[62%]"
      >
        <div className="surface flex items-center gap-3 p-3.5">
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-highlight/50 text-highlight-foreground">
            <MapPinIcon className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{t("clubTitle")}</p>
            <p className="truncate text-xs text-muted-foreground">
              {t("clubMeta")}
            </p>
          </div>
        </div>
      </Float>
    </div>
  );
}
