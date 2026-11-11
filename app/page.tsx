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
import { OfferCard } from "@/components/offer-card";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/require-user";
import { searchClubs } from "@/lib/clubs/club-search";
import { getOfferFeed } from "@/lib/offers/feed";
import { DISTRICT_LABELS } from "@/lib/profile/options";

// How many live offers the landing page previews.
const OFFER_PREVIEW = 3;

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
        <div className="container-page grid items-center gap-12 py-12 sm:py-16 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:gap-16 lg:py-24">
          {/* No scroll-in animation up here: the hero is the first paint. */}
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-sm font-medium shadow-xs">
              <span className="size-2 rounded-full bg-highlight ring-2 ring-highlight/40" />
              {t("eyebrow")}
            </p>
            <h1 className="mt-6 text-5xl leading-[1.02] font-bold tracking-tight sm:text-6xl xl:text-7xl">
              {t("title")}{" "}
              <span className="text-primary">{t("titleAccent")}</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground sm:text-xl">
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
            <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t pt-8">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <dd className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
                    <NumberTicker value={stat.value} />
                    {stat.suffix && ` ${stat.suffix}`}
                  </dd>
                  <dt className="mt-1 text-sm text-muted-foreground">
                    {stat.label}
                  </dt>
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
          className="border-y bg-card/70 py-6"
        >
          <p className="eyebrow text-center">{t("clubsStrip")}</p>
          {/* The list twice, the second copy hidden from assistive tech: the
              track slides by one copy, so the loop has no seam. */}
          <div className="mt-4 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
            <div className="animate-marquee flex w-max gap-6 hover:[animation-play-state:paused]">
              {[false, true].map((copy) => (
                <ul
                  key={String(copy)}
                  aria-hidden={copy}
                  className="flex shrink-0 gap-6"
                >
                  {clubs.map((club) => (
                    <li key={club.id}>
                      <Link
                        href={`/clubs/${club.id}`}
                        tabIndex={copy ? -1 : undefined}
                        className="font-heading text-lg font-semibold whitespace-nowrap text-muted-foreground transition-colors hover:text-primary"
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
          <p className="mt-8 text-center">
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
