import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { connection } from "next/server";

import { OfferCard } from "@/components/offer-card";
import { OfferFilters } from "@/components/offer-filters";
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

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          {showHidden ? t("hiddenTitle") : t("title")}
        </h1>
        {showHidden ? (
          <Link
            href="/offers"
            className={buttonVariants({ variant: "outline" })}
          >
            {t("backToFeed")}
          </Link>
        ) : (
          <Link href="/offers/new" className={buttonVariants()}>
            {t("postAnOffer")}
          </Link>
        )}
      </div>

      {showHidden ? (
        viewer && (
          <p className="mt-2 text-sm text-muted-foreground">
            {t("hiddenIntro")}
          </p>
        )
      ) : (
        <>
          <OfferFilters filters={filters} />
          {viewer && (
            <p className="mt-4 text-right text-sm">
              <Link
                href="/offers?show=hidden"
                className="text-muted-foreground hover:underline"
              >
                {t("showHidden")}
              </Link>
            </p>
          )}
        </>
      )}

      {feed.offers.length === 0 ? (
        <p className="mt-6 text-muted-foreground">
          {showHidden
            ? t("noHiddenOffers")
            : feed.page > 1
              ? t("noMoreOffers")
              : filtered
                ? t("noneMatchFilters")
                : t("noOpenOffers")}
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
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
      )}

      {(feed.page > 1 || feed.hasNextPage) && (
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
      )}
    </main>
  );
}
