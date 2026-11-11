import {
  EyeOffIcon,
  PlusIcon,
  SearchXIcon,
  UsersIcon,
  ZapIcon,
} from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { connection } from "next/server";
import type { ReactNode } from "react";

import { EmptyState } from "@/components/empty-state";
import { OfferCard } from "@/components/offer-card";
import { OfferFilters } from "@/components/offer-filters";
import { ListingLayout, PageHeader, PageShell } from "@/components/page-shell";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/require-user";
import { getOfferFeed, parsePage } from "@/lib/offers/feed";
import { feedHref, parseFeedFilters } from "@/lib/offers/feed-filters";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const params = await searchParams;
  const t = await getTranslations("OffersPage");
  return { title: params.show === "hidden" ? t("hiddenTitle") : t("title") };
}

// The offer feed (task 3.6): public, read on the server per request, one page
// at a time. The page and the filters (3.7) live in the URL, so a feed can
// be shared and "back" works. Ranked by ELO closeness for a signed-in
// viewer, by date for a guest (task 3.9) — getOfferFeed decides which from
// the viewer id alone.
//
// ?show=hidden (slice N) reuses this same page for the offers a signed-in
// viewer hid from their feed, rather than a second list UI — the filters
// form is skipped there since a short personal list doesn't need them.
export default async function OffersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Offers change all the time; never serve a page built earlier.
  await connection();
  const params = await searchParams;
  const filters = parseFeedFilters(params);
  const showHidden = params.show === "hidden";
  const viewer = await getCurrentUser();
  const feed = await getOfferFeed(
    parsePage(params.page),
    filters,
    viewer?.id ?? null,
    new Date(),
    showHidden,
  );
  const filtered = Object.keys(filters).length > 0;
  const t = await getTranslations("OffersPage");

  const results =
    feed.offers.length === 0 ? (
      <EmptyState
        icon={<SearchXIcon />}
        action={
          !showHidden &&
          feed.page === 1 && (
            <Link href="/offers/new" className={buttonVariants()}>
              {t("postAnOffer")}
            </Link>
          )
        }
      >
        {showHidden
          ? t("noHiddenOffers")
          : feed.page > 1
            ? t("noMoreOffers")
            : filtered
              ? t("noneMatchFilters")
              : t("noOpenOffers")}
      </EmptyState>
    ) : (
      <ul className="grid gap-3 xl:grid-cols-2">
        {feed.offers.map((offer) => (
          <li key={offer.id}>
            <OfferCard
              offer={offer}
              viewerId={viewer?.id ?? null}
              dismissed={showHidden}
            />
          </li>
        ))}
      </ul>
    );

  const pages = (feed.page > 1 || feed.hasNextPage) && (
    <nav
      aria-label={t("pagesLabel")}
      className="mt-6 flex items-center justify-between"
    >
      {feed.page > 1 ? (
        <Link
          href={feedHref(filters, feed.page - 1, showHidden)}
          className={buttonVariants({ variant: "outline" })}
        >
          {t("previous")}
        </Link>
      ) : (
        <span />
      )}
      {feed.hasNextPage && (
        <Link
          href={feedHref(filters, feed.page + 1, showHidden)}
          className={buttonVariants({ variant: "outline" })}
        >
          {t("next")}
        </Link>
      )}
    </nav>
  );

  return (
    <PageShell>
      <PageHeader
        eyebrow={t("eyebrow")}
        title={showHidden ? t("hiddenTitle") : t("title")}
        subtitle={showHidden ? viewer && t("hiddenIntro") : t("subtitle")}
        actions={
          showHidden ? (
            <Link
              href="/offers"
              className={buttonVariants({ variant: "outline" })}
            >
              {t("backToFeed")}
            </Link>
          ) : (
            <Link href="/offers/new" className={buttonVariants({ size: "lg" })}>
              <PlusIcon />
              {t("postAnOffer")}
            </Link>
          )
        }
      />

      {showHidden ? (
        <div className="mt-6">
          {results}
          {pages}
        </div>
      ) : (
        <ListingLayout
          sidebar={
            <>
              <OfferFilters filters={filters} />
              {/* "Шукають гру" (U2.2), "Грати сьогодні" (U3.1) and the
                  hidden offers: signed-in players only — a guest sees none
                  of these links, same gate the pages enforce themselves. */}
              {viewer && (
                <nav
                  aria-label={t("shortcutsLabel")}
                  className="surface divide-y text-sm font-medium"
                >
                  <SideLink href="/offers/today" icon={<ZapIcon />}>
                    {t("playToday")}
                  </SideLink>
                  <SideLink href="/offers/looking" icon={<UsersIcon />}>
                    {t("lookingForGame")}
                  </SideLink>
                  <SideLink href="/offers?show=hidden" icon={<EyeOffIcon />}>
                    {t("showHidden")}
                  </SideLink>
                </nav>
              )}
            </>
          }
        >
          {results}
          {pages}
        </ListingLayout>
      )}
    </PageShell>
  );
}

function SideLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3 transition-colors outline-none first:rounded-t-2xl last:rounded-b-2xl hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-4"
    >
      <span className="text-primary">{icon}</span>
      <span className="flex-1">{children}</span>
    </Link>
  );
}
