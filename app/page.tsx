import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { connection } from "next/server";

import { ClubFiltersForm } from "@/components/club-filters";
import { ClubList } from "@/components/club-list";
import { ClubMap } from "@/components/club-map";
import { ClubsView } from "@/components/clubs-view";
import { buttonVariants } from "@/components/ui/button";
import { clubsHref, parseClubFilters } from "@/lib/clubs/club-filters";
import { searchClubs } from "@/lib/clubs/club-search";

// The home page is the court search (slice K4): what most visitors come for
// is a court to play on, then someone to play with. The list and the map
// are the former /clubs page (2.6-2.7), now narrowed by URL filters; /clubs
// redirects here. Each club links out to book (the app has no booking,
// decision 2026-09-20) and to its open offers.
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Read on each request: clubs and their open offers change without a deploy.
  await connection();
  const filters = parseClubFilters(await searchParams);
  const clubs = await searchClubs(filters);
  const filtered = Object.keys(filters).length > 0;
  const t = await getTranslations("HomePage");

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="mt-1 text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Link
          href="/offers"
          className={buttonVariants({ variant: "secondary" })}
        >
          {t("browseOffers")}
        </Link>
      </div>

      <ClubFiltersForm filters={filters} />

      <ClubsView
        list={<ClubList clubs={clubs} filtered={filtered} />}
        map={
          <ClubMap
            // A new search remounts the map so its first view fits the
            // clubs found, not the previous search's.
            key={clubsHref(filters)}
            markers={clubs}
            className="h-full overflow-hidden rounded-xl border shadow-sm"
          />
        }
      />
    </main>
  );
}
