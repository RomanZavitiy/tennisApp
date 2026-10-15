import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { createOffer } from "@/app/(member)/offers/new/actions";
import { OfferForm } from "@/components/offer-form";
import { requireOnboardedUser } from "@/lib/auth/require-onboarded-user";
import { db } from "@/lib/db";
import { toKrakowLocal } from "@/lib/offers/krakow-time";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("NewOfferPage");
  return { title: t("title") };
}

// The (member) layout has already checked the session and the profile.
export default async function NewOfferPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslations("NewOfferPage");
  const player = await requireOnboardedUser();
  const clubs = await db.club.findMany({
    select: { id: true, name: true, district: true },
    orderBy: { name: "asc" },
  });
  // "Create an offer at this club" (task 2.10): a bad or unknown id is
  // simply ignored, same as every other optional query param in the app.
  const rawClubId = (await searchParams).clubId;
  const clubId = Array.isArray(rawClubId) ? rawClubId[0] : rawClubId;

  return (
    <main className="mx-auto w-full max-w-sm flex-1 px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="mt-2 mb-6 text-muted-foreground">{t("subtitle")}</p>
      <OfferForm
        action={createOffer}
        clubs={clubs}
        defaultDistrict={player.district}
        defaultClubId={clubId}
        earliestStart={toKrakowLocal(new Date())}
      />
      <Link
        href="/offers"
        className="mt-4 block text-center text-sm text-muted-foreground hover:underline"
      >
        {t("cancel")}
      </Link>
    </main>
  );
}
