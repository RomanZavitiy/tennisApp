import { CheckIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { CourtLines } from "@/components/court-lines";
import { cn } from "@/lib/utils";

// Page layouts (redesign): every page picks one of these instead of its own
// centred column, so the app uses a desktop screen's width the same way
// everywhere — wide for lists and dashboards, a two-column split for forms.

const WIDTHS = {
  /** Lists, dashboards, the court search. */
  wide: "max-w-7xl",
  /** Detail pages with a main column and a side column. */
  content: "max-w-6xl",
  /** Long-form reading (terms, privacy): line length stays readable. */
  prose: "max-w-3xl",
} as const;

export function PageShell({
  width = "wide",
  className,
  children,
}: {
  width?: keyof typeof WIDTHS;
  className?: string;
  children: ReactNode;
}) {
  return (
    <main
      className={cn(
        "mx-auto w-full flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-8",
        WIDTHS[width],
        className,
      )}
    >
      {children}
    </main>
  );
}

/** A page's title block: eyebrow, h1, a line of context, and its actions. */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 max-w-2xl text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  );
}

/** Filters in a sticky side column, results next to them; stacked on a
 * phone. */
export function ListingLayout({
  sidebar,
  children,
}: {
  sidebar: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)] lg:items-start">
      <aside className="space-y-4 lg:sticky lg:top-24">{sidebar}</aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/** Form pages (sign in, onboarding, edit profile…): the form in a card on
 * the left, the brand panel filling the rest of a desktop screen. */
export function SplitShell({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto grid w-full max-w-6xl flex-1 items-start gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-[minmax(0,27rem)_minmax(0,1fr)] lg:gap-10 lg:px-8 lg:py-14">
      <div className={cn("surface w-full p-6 sm:p-8", className)}>
        {children}
      </div>
      <BrandPanel />
    </main>
  );
}

function BrandPanel() {
  const t = useTranslations("BrandPanel");
  const points = [t("point1"), t("point2"), t("point3")];

  return (
    <aside className="relative hidden min-h-[30rem] overflow-hidden rounded-3xl bg-brand p-10 text-brand-foreground shadow-md lg:sticky lg:top-24 lg:flex lg:flex-col lg:justify-between">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(40rem_24rem_at_100%_0%,color-mix(in_oklch,var(--highlight)_45%,transparent),transparent_70%)]"
      />
      <CourtLines className="absolute -right-24 -bottom-28 w-[34rem] rotate-[-18deg] text-brand-foreground/15" />
      <div className="relative">
        <p className="text-xs font-bold tracking-[0.14em] text-brand-foreground/70 uppercase">
          {t("eyebrow")}
        </p>
        <p className="mt-3 max-w-md font-heading text-4xl leading-[1.05] font-bold tracking-tight">
          {t("title")}
        </p>
      </div>
      <ul className="relative mt-10 space-y-3">
        {points.map((point) => (
          <li key={point} className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-highlight text-highlight-foreground">
              <CheckIcon aria-hidden className="size-3.5" />
            </span>
            <span className="text-brand-foreground/90">{point}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
