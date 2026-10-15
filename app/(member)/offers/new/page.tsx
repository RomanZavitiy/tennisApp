import type { Metadata } from "next";
import Link from "next/link";

import { createOffer } from "@/app/(member)/offers/new/actions";
import { OfferForm } from "@/components/offer-form";
import { requireOnboardedUser } from "@/lib/auth/require-onboarded-user";
import { db } from "@/lib/db";
import { toKrakowLocal } from "@/lib/offers/krakow-time";

export const metadata: Metadata = { title: "Post a sparring offer" };

// The (member) layout has already checked the session and the profile.
export default async function NewOfferPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
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
      <h1 className="text-2xl font-semibold tracking-tight">
        Post a sparring offer
      </h1>
      <p className="mt-2 mb-6 text-muted-foreground">
        Say when and where you want to play; other players ask to join.
      </p>
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
        Cancel
      </Link>
    </main>
  );
}
