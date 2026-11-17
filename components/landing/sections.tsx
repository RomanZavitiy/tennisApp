import {
  ArrowRightIcon,
  BellRingIcon,
  ChevronDownIcon,
  GraduationCapIcon,
  MapPinnedIcon,
  TrendingUpIcon,
  UsersIcon,
  ZapIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import type { ReactNode } from "react";

import { CourtLines } from "@/components/court-lines";
import { IconTile, type IconTileTone } from "@/components/icon-tile";
import { Reveal } from "@/components/landing/motion";
import { buttonVariants } from "@/components/ui/button";
import { visibleLinks } from "@/lib/features";
import { cn } from "@/lib/utils";

// The landing page's sections below the hero (redesign). Server components:
// only the scroll-in animation (Reveal) runs on the client.

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <Reveal className="max-w-3xl">
      <p className="eyebrow inline-flex items-center gap-2 text-current">
        <span aria-hidden className="h-0.5 w-6 rounded-full bg-current" />
        {eyebrow}
      </p>
      <h2 className="mt-4 text-4xl leading-[1.05] font-extrabold sm:text-6xl">
        {title}
      </h2>
      {subtitle && <p className="mt-4 text-lg opacity-75">{subtitle}</p>}
    </Reveal>
  );
}

type Feature = {
  key: string;
  icon: ReactNode;
  tone: IconTileTone;
  href: string;
  /** Twice as wide on desktop. */
  wide?: boolean;
  /** A solid colour block instead of a white card. */
  block?: keyof typeof BLOCKS;
};

// The bento grid's colour blocks (redesign): most tiles are white cards, a
// few are solid forest or lime, so the grid reads as blocks, not as a list.
const BLOCKS = {
  forest: "border-transparent bg-brand text-brand-foreground",
  lime: "border-transparent bg-highlight text-highlight-foreground",
} as const;

const FEATURES: Feature[] = [
  {
    key: "sparring",
    icon: <UsersIcon />,
    tone: "ball",
    href: "/offers",
    wide: true,
    block: "forest",
  },
  { key: "courts", icon: <MapPinnedIcon />, tone: "blue", href: "/clubs" },
  {
    key: "rating",
    icon: <TrendingUpIcon />,
    tone: "green",
    href: "/leaderboard",
    block: "lime",
  },
  { key: "today", icon: <ZapIcon />, tone: "orange", href: "/offers/today" },
  {
    key: "coaches",
    icon: <GraduationCapIcon />,
    tone: "violet",
    href: "/coaches",
  },
  { key: "alerts", icon: <BellRingIcon />, tone: "green", href: "/install" },
];

const GRID_COLUMNS = 3;

/** The tiles whose section is switched on (lib/features.ts). If hiding some
 * leaves a single empty cell at the end of the desktop grid, the last tile
 * stretches to fill it. */
function visibleFeatures(): Feature[] {
  const tiles = visibleLinks(FEATURES);
  const cells = tiles.reduce((sum, tile) => sum + (tile.wide ? 2 : 1), 0);
  const last = tiles.at(-1);
  if (!last || last.wide || cells % GRID_COLUMNS !== GRID_COLUMNS - 1) {
    return tiles;
  }
  return [...tiles.slice(0, -1), { ...last, wide: true }];
}

export function Features() {
  const t = useTranslations("LandingPage.features");

  return (
    <section className="container-page py-16 sm:py-24">
      <SectionHeading
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
      />
      <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleFeatures().map((feature, index) => (
          <li key={feature.key} className={cn(feature.wide && "lg:col-span-2")}>
            <Reveal delay={(index % 3) * 0.08} className="h-full">
              <Link
                href={feature.href}
                className={cn(
                  "group block-lift flex h-full min-h-56 flex-col rounded-3xl border bg-card p-6 outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-7",
                  feature.block && BLOCKS[feature.block],
                )}
              >
                <IconTile
                  tone={feature.tone}
                  className="size-12 rounded-2xl [&_svg]:size-5"
                >
                  {feature.icon}
                </IconTile>
                <h3
                  className={cn(
                    "mt-6 text-2xl font-bold",
                    feature.wide && "sm:text-3xl",
                  )}
                >
                  {t(`${feature.key}.title`)}
                </h3>
                <p className="mt-2 max-w-xl flex-1 opacity-75">
                  {t(`${feature.key}.text`)}
                </p>
                <span className="mt-6 inline-flex items-center gap-1 text-sm font-bold">
                  {t(`${feature.key}.link`)}
                  <ArrowRightIcon
                    aria-hidden
                    className="size-4 transition-transform group-hover:translate-x-1"
                  />
                </span>
              </Link>
            </Reveal>
          </li>
        ))}
      </ul>
    </section>
  );
}

const STEPS = ["profile", "offer", "play"] as const;

export function HowItWorks() {
  const t = useTranslations("LandingPage.steps");

  return (
    <section className="bg-highlight text-highlight-foreground">
      <div className="container-page py-16 sm:py-24">
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} />
        <ol className="mt-12 grid gap-4 lg:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step}>
              <Reveal
                delay={index * 0.1}
                className="relative h-full rounded-3xl bg-brand p-6 text-brand-foreground sm:p-8"
              >
                <span className="font-heading text-7xl leading-none font-extrabold text-highlight tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-6 text-2xl font-bold">
                  {t(`${step}.title`)}
                </h3>
                <p className="mt-2 text-brand-foreground/80">
                  {t(`${step}.text`)}
                </p>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const QUESTIONS = [
  "free",
  "rating",
  "padel",
  "booking",
  "city",
  "app",
] as const;

export function Faq() {
  const t = useTranslations("LandingPage.faq");

  return (
    <section className="container-page py-16 sm:py-24">
      <SectionHeading eyebrow={t("eyebrow")} title={t("title")} />
      <Reveal className="mt-10 max-w-3xl">
        <div className="surface divide-y overflow-hidden rounded-3xl">
          {QUESTIONS.map((question) => (
            // Native <details>: an accordion with no JavaScript.
            <details key={question} className="group px-5 sm:px-6">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-heading text-lg font-bold tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
                {t(`${question}.question`)}
                <ChevronDownIcon
                  aria-hidden
                  className="size-8 shrink-0 rounded-full bg-muted p-2 transition-all group-open:rotate-180 group-open:bg-highlight group-open:text-highlight-foreground"
                />
              </summary>
              <p className="pb-5 text-muted-foreground">
                {t(`${question}.answer`)}
              </p>
            </details>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

export function FinalCta({
  primary,
  secondary,
}: {
  primary: { href: string; label: string };
  secondary: { href: string; label: string };
}) {
  const t = useTranslations("LandingPage.cta");

  return (
    <section className="container-page pb-8">
      <Reveal>
        <div className="relative overflow-hidden rounded-[2.5rem] bg-brand px-6 py-16 text-center text-brand-foreground sm:px-12 sm:py-24">
          {/* The ball, flat, cut off by the corner. */}
          <div
            aria-hidden
            className="absolute -top-20 -right-16 size-56 rounded-full bg-highlight sm:size-72"
          />
          <CourtLines className="absolute -bottom-40 -left-16 w-[26rem] rotate-[28deg] text-brand-foreground/12" />
          <div className="relative mx-auto max-w-3xl">
            <h2 className="text-4xl leading-[1.03] font-extrabold sm:text-7xl">
              {t("title")}
            </h2>
            <p className="mt-4 text-lg text-brand-foreground/85">
              {t("subtitle")}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href={primary.href}
                className={buttonVariants({
                  size: "lg",
                  className:
                    "h-12 bg-highlight! px-7 text-base text-highlight-foreground! shadow-none hover:bg-[color-mix(in_oklch,var(--highlight),black_6%)]!",
                })}
              >
                {primary.label}
                <ArrowRightIcon />
              </Link>
              <Link
                href={secondary.href}
                className={buttonVariants({
                  size: "lg",
                  variant: "outline",
                  className:
                    "h-12 border-brand-foreground/30! bg-transparent! px-7 text-base text-brand-foreground! shadow-none hover:bg-brand-foreground/10!",
                })}
              >
                {secondary.label}
              </Link>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
