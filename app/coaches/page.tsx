import { GraduationCapIcon } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { connection } from "next/server";

import { CoachFiltersForm } from "@/components/coach-filters";
import { CoachCard } from "@/components/coach-card";
import { EmptyState } from "@/components/empty-state";
import { ListingLayout, PageHeader, PageShell } from "@/components/page-shell";
import { getCoaches } from "@/lib/coaches/get-coaches";
import { parseCoachFilters } from "@/lib/validation/coaches-query";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("CoachesPage");
  return { title: t("title") };
}

// The coaching directory (tasks P.7-P.9): a read-only list of owner-curated
// coaches, filterable by district and level — no self-registration, no
// approval queue in v1 (decision 2026-11-07, task P.1). Public, like
// /clubs and /leaderboard: contact goes out by phone or website, no
// in-app booking.
export default async function CoachesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // The directory grows as the owner adds entries; never serve a page
  // built earlier.
  await connection();
  const params = await searchParams;
  const filters = parseCoachFilters(params);
  const coaches = await getCoaches(filters);
  const filtered = Object.keys(filters).length > 0;
  const t = await getTranslations("CoachesPage");

  return (
    <PageShell>
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
      />

      <ListingLayout sidebar={<CoachFiltersForm filters={filters} />}>
        {coaches.length === 0 ? (
          <EmptyState icon={<GraduationCapIcon />}>
            {/* The directory is small while the owner is still adding
                entries (task P.9) — framed as "growing", not "no results",
                even when filters are the reason the list is empty. */}
            {filtered ? t("noneMatchFilters") : t("directoryGrowing")}
          </EmptyState>
        ) : (
          <ul className="grid gap-4 xl:grid-cols-2">
            {coaches.map((coach) => (
              <li key={coach.id}>
                <CoachCard coach={coach} />
              </li>
            ))}
          </ul>
        )}
      </ListingLayout>
    </PageShell>
  );
}
