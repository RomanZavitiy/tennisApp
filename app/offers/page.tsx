import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";

import { OfferCard } from "@/components/offer-card";
import { buttonVariants } from "@/components/ui/button";
import { getOfferFeed, parsePage } from "@/lib/offers/feed";

export const metadata: Metadata = { title: "Sparring offers" };

// The offer feed (task 3.6): public, read on the server per request, one page
// at a time. The page lives in the URL (?page=2), so it can be shared and
// "back" works; filters (3.7) will join it there.
export default async function OffersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Offers change all the time; never serve a page built earlier.
  await connection();
  const { page } = await searchParams;
  const feed = await getOfferFeed(parsePage(page));

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          Sparring offers
        </h1>
        <Link href="/offers/new" className={buttonVariants()}>
          Post an offer
        </Link>
      </div>

      {feed.offers.length === 0 ? (
        <p className="mt-6 text-muted-foreground">
          {feed.page === 1
            ? "No open offers right now. Post one and other players can join you."
            : "No more offers."}
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {feed.offers.map((offer) => (
            <li key={offer.id}>
              <OfferCard offer={offer} />
            </li>
          ))}
        </ul>
      )}

      {(feed.page > 1 || feed.hasNextPage) && (
        <nav
          aria-label="Pages"
          className="mt-6 flex items-center justify-between"
        >
          {feed.page > 1 ? (
            <Link
              href={
                feed.page === 2
                  ? "/offers"
                  : `/offers?page=${String(feed.page - 1)}`
              }
              className={buttonVariants({ variant: "outline" })}
            >
              Previous
            </Link>
          ) : (
            <span />
          )}
          {feed.hasNextPage && (
            <Link
              href={`/offers?page=${String(feed.page + 1)}`}
              className={buttonVariants({ variant: "outline" })}
            >
              Next
            </Link>
          )}
        </nav>
      )}
    </main>
  );
}
