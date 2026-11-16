import { UsersIcon } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { connection } from "next/server";

import { EmptyState } from "@/components/empty-state";
import { ListingLayout, PageHeader, PageShell } from "@/components/page-shell";
import { postPlayIntent } from "@/app/offers/looking/actions";
import { IntentCard } from "@/components/intent-card";
import { IntentFilters } from "@/components/intent-filters";
import { PostIntentForm } from "@/components/post-intent-form";
import { buttonVariants } from "@/components/ui/button";
import { requireOnboardedUser } from "@/lib/auth/require-onboarded-user";
import { parseFeedFilters } from "@/lib/offers/feed-filters";
import { getMyOpenOffers } from "@/lib/offers/my-open-offers";
import { getPlayIntentFeed } from "@/lib/offers/play-intent-feed";
import { getCurrentSport } from "@/lib/sport/current-sport";
import { todayInKrakow } from "@/lib/validation/profile";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("LookingForGamePage");
  const sport = await getCurrentSport();
  return { title: t(sport === "PADEL" ? "titlePadel" : "title") };
}

// "Шукають гру" (slice U2, tasks U2.1-U2.3): a tab beside the offer feed,
// for signed-in players only (owner decision 2026-11-07) — unlike
// /offers, there's no guest view here, so this gates the whole page on
// requireOnboardedUser rather than reading getCurrentUser().
// Slice PD2: one sport at a time, the header switcher's — the posts shown,
// the form, and the viewer's own games offered for "invite to my game".
export default async function LookingForGamePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const viewer = await requireOnboardedUser();
  const filters = parseFeedFilters(await searchParams);
  const sport = await getCurrentSport();
  const now = new Date();
  const [intents, myOpenOffers] = await Promise.all([
    getPlayIntentFeed(viewer.id, { ...filters, sport }, now),
    getMyOpenOffers(viewer.id, now, sport),
  ]);
  const t = await getTranslations("LookingForGamePage");

  return (
    <PageShell>
      <PageHeader
        title={t(sport === "PADEL" ? "titlePadel" : "title")}
        subtitle={t("subtitle")}
        actions={
          <Link
            href="/offers"
            className={buttonVariants({ variant: "outline" })}
          >
            {t("backToFeed")}
          </Link>
        }
      />

      <ListingLayout
        sidebar={
          <>
            <section className="surface p-4">
              <h2 className="font-semibold">{t("postYours")}</h2>
              <div className="mt-3">
                <PostIntentForm
                  action={postPlayIntent}
                  sport={sport}
                  defaultDate={todayInKrakow()}
                />
              </div>
            </section>
            <IntentFilters filters={filters} sport={sport} />
          </>
        }
      >
        {intents.length === 0 ? (
          <EmptyState icon={<UsersIcon />}>{t("noneYet")}</EmptyState>
        ) : (
          <ul className="grid gap-3 xl:grid-cols-2">
            {intents.map((intent) => (
              <IntentCard
                key={intent.id}
                intent={intent}
                myOpenOffers={
                  intent.user.id === viewer.id ? null : myOpenOffers
                }
              />
            ))}
          </ul>
        )}
      </ListingLayout>
    </PageShell>
  );
}
