import { ArrowRightIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { connection } from "next/server";

import { HeroVisual } from "@/components/landing/hero-visual";
import { NumberTicker } from "@/components/landing/motion";
import {
  Faq,
  Features,
  FinalCta,
  HowItWorks,
  SectionHeading,
} from "@/components/landing/sections";
import { WhySpinBuddy } from "@/components/landing/why";
import { OfferCard } from "@/components/offer-card";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/require-user";
import { cn } from "@/lib/utils";
import { searchClubs } from "@/lib/clubs/club-search";
import { getOfferFeed } from "@/lib/offers/feed";
import { DISTRICT_LABELS } from "@/lib/profile/options";

// How many live offers the landing page previews.
const OFFER_PREVIEW = 3;

// The hero's stat blocks, in order (redesign).
const STAT_BLOCKS = [
  "bg-brand text-brand-foreground [&_dd]:text-highlight",
  "bg-highlight text-highlight-foreground",
  "border bg-card",
] as const;

// The landing page (redesign): says what SpinBuddy is before asking a
// visitor to use it — hero, the clubs on the map, features, how it works,
// live offers, FAQ. The court search that used to be here (slice K4) is back
// at /clubs. Its numbers are real: clubs and offers are read per request.
export default async function Home() {
  await connection();
  const [viewer, clubs, feed, t] = await Promise.all([
    getCurrentUser(),
    searchClubs({}),
    getOfferFeed(1, {}, null, new Date(), false),
    getTranslations("LandingPage"),
  ]);
  const offers = feed.offers.slice(0, OFFER_PREVIEW);

  // A signed-in player has no use for "Join": their first step is the feed.
  const primary = viewer
    ? { href: "/offers", label: t("browseOffers") }
    : { href: "/login", label: t("join") };
  const secondary = { href: "/clubs", label: t("findCourt") };

  const stats = [
    { value: clubs.length, label: t("stats.clubs") },
    { value: Object.keys(DISTRICT_LABELS).length, label: t("stats.districts") },
    { value: 0, suffix: t("stats.currency"), label: t("stats.price") },
  ];

  return (
    <main className="flex-1">
      <section className="relative overflow-hidden">
        <div aria-hidden className="bg-grid-fade absolute inset-0 -z-10" />
        <div className="container-page grid items-center gap-12 py-12 sm:py-16 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:gap-16 lg:py-20">
          {/* No scroll-in animation up here: the hero is the first paint. */}
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-primary px-3.5 py-1.5 text-sm font-semibold text-primary-foreground">
              <span className="size-2 rounded-full bg-current" />
              {t("eyebrow")}
            </p>
            <h1 className="mt-6 text-[2.75rem] leading-[1.04] font-extrabold sm:text-7xl xl:text-[5.25rem]">
              {t("title")}{" "}
              <span className="marker inline-block -rotate-1">
                {t("titleAccent")}
              </span>
            </h1>
            <p className="mt-7 max-w-xl text-lg text-muted-foreground sm:text-xl">
              {t("subtitle")}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href={primary.href}
                className={buttonVariants({
                  size: "lg",
                  className: "h-12 px-7 text-base",
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
                  className: "h-12 px-7 text-base",
                })}
              >
                {secondary.label}
              </Link>
            </div>
            {/* Three blocks, three colours: forest, lime, white. */}
            <dl className="mt-12 grid max-w-xl grid-cols-3 gap-3">
              {stats.map((stat, index) => (
                <div
                  key={stat.label}
                  className={cn(
                    "flex flex-col-reverse justify-end rounded-2xl p-4 sm:p-5",
                    STAT_BLOCKS[index % STAT_BLOCKS.length],
                  )}
                >
                  <dt className="mt-1 text-sm font-medium opacity-80">
                    {stat.label}
                  </dt>
                  <dd className="font-heading text-3xl font-extrabold tracking-tight sm:text-5xl">
                    <NumberTicker value={stat.value} />
                    {stat.suffix && ` ${stat.suffix}`}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <HeroVisual />
        </div>
      </section>

      {clubs.length > 0 && (
        <section
          aria-label={t("clubsStrip")}
          className="bg-brand py-7 text-brand-foreground"
        >
          <p className="eyebrow text-center text-brand-foreground/70">
            {t("clubsStrip")}
          </p>
          {/* The list twice, the second copy hidden from assistive tech: the
              track slides by one copy, so the loop has no seam. */}
          <div className="mt-4 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
            <div className="animate-marquee flex w-max gap-6 hover:[animation-play-state:paused]">
              {[false, true].map((copy) => (
                <ul
                  key={String(copy)}
                  aria-hidden={copy}
                  className="flex shrink-0 items-center gap-6 [&>li]:flex [&>li]:items-center [&>li]:gap-6 [&>li]:after:size-2 [&>li]:after:rounded-full [&>li]:after:bg-highlight"
                >
                  {clubs.map((club) => (
                    <li key={club.id}>
                      <Link
                        href={`/clubs/${club.id}`}
                        tabIndex={copy ? -1 : undefined}
                        className="font-heading text-2xl font-bold tracking-tight whitespace-nowrap transition-colors hover:text-highlight"
                      >
                        {club.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          </div>
        </section>
      )}

      <WhySpinBuddy />
      <Features />
      <HowItWorks />

      {offers.length > 0 && (
        <section className="container-page py-16 sm:py-24">
          <SectionHeading
            eyebrow={t("liveOffers.eyebrow")}
            title={t("liveOffers.title")}
          />
          <ul className="mt-10 grid gap-4 lg:grid-cols-3">
            {offers.map((offer) => (
              <li key={offer.id}>
                <OfferCard offer={offer} />
              </li>
            ))}
          </ul>
          <p className="mt-8">
            <Link
              href="/offers"
              className={buttonVariants({ variant: "secondary", size: "lg" })}
            >
              {t("liveOffers.seeAll")}
              <ArrowRightIcon />
            </Link>
          </p>
        </section>
      )}

      <Faq />
      <FinalCta primary={primary} secondary={secondary} />
    </main>
  );
}
