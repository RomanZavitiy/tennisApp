import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { connection } from "next/server";

import { postPlayIntent } from "@/app/offers/looking/actions";
import { IntentCard } from "@/components/intent-card";
import { IntentFilters } from "@/components/intent-filters";
import { PostIntentForm } from "@/components/post-intent-form";
import { buttonVariants } from "@/components/ui/button";
import { requireOnboardedUser } from "@/lib/auth/require-onboarded-user";
import { parseFeedFilters } from "@/lib/offers/feed-filters";
import { getMyOpenOffers } from "@/lib/offers/my-open-offers";
import { getPlayIntentFeed } from "@/lib/offers/play-intent-feed";
import { todayInKrakow } from "@/lib/validation/profile";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("LookingForGamePage");
  return { title: t("title") };
}

// "Шукають гру" (slice U2, tasks U2.1-U2.3): a tab beside the offer feed,
// for signed-in players only (owner decision 2026-11-07) — unlike
// /offers, there's no guest view here, so this gates the whole page on
// requireOnboardedUser rather than reading getCurrentUser().
export default async function LookingForGamePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const viewer = await requireOnboardedUser();
  const filters = parseFeedFilters(await searchParams);
  const [intents, myOpenOffers] = await Promise.all([
    getPlayIntentFeed(viewer.id, filters),
    getMyOpenOffers(viewer.id),
  ]);
  const t = await getTranslations("LookingForGamePage");

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <Link href="/offers" className={buttonVariants({ variant: "outline" })}>
          {t("backToFeed")}
        </Link>
      </div>
      <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>

      <section className="mt-6 rounded-xl border bg-card p-4 shadow-sm">
        <h2 className="font-semibold">{t("postYours")}</h2>
        <div className="mt-3">
          <PostIntentForm
            action={postPlayIntent}
            defaultDate={todayInKrakow()}
          />
        </div>
      </section>

      <IntentFilters filters={filters} />

      {intents.length === 0 ? (
        <p className="mt-6 text-muted-foreground">{t("noneYet")}</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {intents.map((intent) => (
            <IntentCard
              key={intent.id}
              intent={intent}
              myOpenOffers={intent.user.id === viewer.id ? null : myOpenOffers}
            />
          ))}
        </ul>
      )}
    </main>
  );
}
