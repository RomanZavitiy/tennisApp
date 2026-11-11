import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { connection } from "next/server";

import { CoachFiltersForm } from "@/components/coach-filters";
import { CoachCard } from "@/components/coach-card";
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
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>

      <CoachFiltersForm filters={filters} />

      {coaches.length === 0 ? (
        <p className="mt-6 text-muted-foreground">
          {/* The directory is small while the owner is still adding entries
              (task P.9) — framed as "growing", not "no results", even when
              filters are the reason the list is empty. */}
          {filtered ? t("noneMatchFilters") : t("directoryGrowing")}
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {coaches.map((coach) => (
            <li key={coach.id}>
              <CoachCard coach={coach} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
