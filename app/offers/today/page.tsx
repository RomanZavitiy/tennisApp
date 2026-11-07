import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { connection } from "next/server";

import {
  trackPlayTodayEmptyState,
  trackPlayTodayResultSelected,
  trackPlayTodayViewed,
} from "@/app/offers/today/actions";
import { IntentCard } from "@/components/intent-card";
import { MarkPlayTodayEvent } from "@/components/mark-play-today-event";
import { OfferCard } from "@/components/offer-card";
import { buttonVariants } from "@/components/ui/button";
import { requireOnboardedUser } from "@/lib/auth/require-onboarded-user";
import { getMyOpenOffers } from "@/lib/offers/my-open-offers";
import { getPlayTodayFeed } from "@/lib/offers/play-today-feed";
import { todayInKrakow } from "@/lib/validation/profile";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("PlayTodayPage");
  return { title: t("title") };
}

// "Грати сьогодні" (slice U3, tasks U3.1-U3.3): open offers starting soon
// that match the viewer's level, plus today's intents (slice U2). Signed-in
// only, same reasoning as /offers/looking — matching by level needs a
// level to match, which a guest doesn't have.
export default async function PlayTodayPage() {
  await connection();
  const viewer = await requireOnboardedUser();
  const [feed, myOpenOffers] = await Promise.all([
    getPlayTodayFeed(viewer.id, viewer.selfRatedNtrp),
    getMyOpenOffers(viewer.id),
  ]);
  const t = await getTranslations("PlayTodayPage");
  const isEmpty = feed.offers.length === 0 && feed.intents.length === 0;

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <Link href="/offers" className={buttonVariants({ variant: "outline" })}>
          {t("backToFeed")}
        </Link>
      </div>
      <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>

      {isEmpty ? (
        <div className="mt-6 space-y-3">
          <MarkPlayTodayEvent action={trackPlayTodayEmptyState} />
          <p className="text-muted-foreground">{t("emptyState")}</p>
          <Link
            href={`/offers/new?startsAt=${todayInKrakow()}T18:00`}
            className={buttonVariants()}
          >
            {t("createForTonight")}
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          <MarkPlayTodayEvent action={trackPlayTodayViewed} />
          {feed.offers.length > 0 && (
            <section>
              <h2 className="font-semibold">{t("offersHeading")}</h2>
              <ul className="mt-2 space-y-3">
                {feed.offers.map((offer) => (
                  <li key={offer.id}>
                    <OfferCard
                      offer={offer}
                      viewerId={viewer.id}
                      onResultSelected={trackPlayTodayResultSelected}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}
          {feed.intents.length > 0 && (
            <section>
              <h2 className="font-semibold">{t("intentsHeading")}</h2>
              <ul className="mt-2 space-y-3">
                {feed.intents.map((intent) => (
                  <IntentCard
                    key={intent.id}
                    intent={intent}
                    myOpenOffers={
                      intent.user.id === viewer.id ? null : myOpenOffers
                    }
                  />
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </main>
  );
}
