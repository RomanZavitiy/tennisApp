import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { connection } from "next/server";

import { ClubFiltersForm } from "@/components/club-filters";
import { ClubList } from "@/components/club-list";
import { ClubMap } from "@/components/club-map";
import { ClubsView } from "@/components/clubs-view";
import { PageHeader, PageShell } from "@/components/page-shell";
import { buttonVariants } from "@/components/ui/button";
import { clubsHref, parseClubFilters } from "@/lib/clubs/club-filters";
import { searchClubs } from "@/lib/clubs/club-search";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("ClubsPage");
  return { title: t("title") };
}

// The court search (slice K4): the club list and the map (2.6-2.7), narrowed
// by URL filters. It was the home page until the redesign gave "/" a landing
// page; each club links out to book and to its open offers.
export default async function ClubsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Read on each request: clubs and their open offers change without a deploy.
  await connection();
  const filters = parseClubFilters(await searchParams);
  const clubs = await searchClubs(filters);
  const filtered = Object.keys(filters).length > 0;
  const t = await getTranslations("ClubsPage");

  return (
    <PageShell>
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
        actions={
          <>
            <Link
              href="/clubs/suggest"
              className={buttonVariants({ variant: "outline" })}
            >
              {t("suggestClub")}
            </Link>
            <Link
              href="/offers"
              className={buttonVariants({ variant: "secondary" })}
            >
              {t("browseOffers")}
            </Link>
          </>
        }
      />

      <ClubFiltersForm filters={filters} />

      <ClubsView
        list={<ClubList clubs={clubs} filtered={filtered} />}
        map={
          <ClubMap
            // A new search remounts the map so its first view fits the
            // clubs found, not the previous search's.
            key={clubsHref(filters)}
            markers={clubs}
            className="h-full overflow-hidden rounded-2xl border shadow-sm"
          />
        }
      />
    </PageShell>
  );
}
