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
    <Reveal className="mx-auto max-w-2xl text-center">
      <p className="eyebrow text-primary">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-3 text-lg text-muted-foreground">{subtitle}</p>
      )}
    </Reveal>
  );
}

type Feature = {
  key: string;
  icon: ReactNode;
  tone: IconTileTone;
  href: string;
  /** The first tile is twice as wide on desktop. */
  wide?: boolean;
};

const FEATURES: Feature[] = [
  {
    key: "sparring",
    icon: <UsersIcon />,
    tone: "green",
    href: "/offers",
    wide: true,
  },
  { key: "courts", icon: <MapPinnedIcon />, tone: "blue", href: "/clubs" },
  {
    key: "rating",
    icon: <TrendingUpIcon />,
    tone: "ball",
    href: "/leaderboard",
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
        {FEATURES.map((feature, index) => (
          <li key={feature.key} className={cn(feature.wide && "lg:col-span-2")}>
            <Reveal delay={(index % 3) * 0.08} className="h-full">
              <Link
                href={feature.href}
                className="group surface flex h-full flex-col p-6 transition-all outline-none hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring"
              >
                <IconTile
                  tone={feature.tone}
                  className="size-11 rounded-xl [&_svg]:size-5"
                >
                  {feature.icon}
                </IconTile>
                <h3 className="mt-5 text-lg font-semibold">
                  {t(`${feature.key}.title`)}
                </h3>
                <p className="mt-2 flex-1 text-muted-foreground">
                  {t(`${feature.key}.text`)}
                </p>
                <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  {t(`${feature.key}.link`)}
                  <ArrowRightIcon
                    aria-hidden
                    className="size-4 transition-transform group-hover:translate-x-0.5"
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
    <section className="border-y bg-card/70">
      <div className="container-page py-16 sm:py-24">
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} />
        <ol className="mt-12 grid gap-6 lg:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step}>
              <Reveal delay={index * 0.1} className="relative h-full">
                <span className="font-heading text-6xl leading-none font-bold text-primary/15 tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 text-xl font-semibold">
                  {t(`${step}.title`)}
                </h3>
                <p className="mt-2 text-muted-foreground">
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

const QUESTIONS = ["free", "rating", "booking", "city", "app"] as const;

export function Faq() {
  const t = useTranslations("LandingPage.faq");

  return (
    <section className="container-page py-16 sm:py-24">
      <SectionHeading eyebrow={t("eyebrow")} title={t("title")} />
      <Reveal className="mx-auto mt-10 max-w-3xl">
        <div className="surface divide-y">
          {QUESTIONS.map((question) => (
            // Native <details>: an accordion with no JavaScript.
            <details key={question} className="group px-5 sm:px-6">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
                {t(`${question}.question`)}
                <ChevronDownIcon
                  aria-hidden
                  className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
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
        <div className="relative overflow-hidden rounded-[2rem] bg-primary px-6 py-14 text-center text-primary-foreground shadow-md sm:px-12 sm:py-20">
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(40rem_24rem_at_100%_0%,color-mix(in_oklch,var(--highlight)_45%,transparent),transparent_70%)]"
          />
          <CourtLines className="absolute -bottom-40 -left-16 w-[26rem] rotate-[28deg] text-primary-foreground/12" />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">
              {t("title")}
            </h2>
            <p className="mt-4 text-lg text-primary-foreground/85">
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
                    "h-12 border-primary-foreground/30! bg-transparent! px-7 text-base text-primary-foreground! shadow-none hover:bg-primary-foreground/10!",
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
