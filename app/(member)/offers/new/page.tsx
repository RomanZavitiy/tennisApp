import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { z } from "zod";

import { SplitShell } from "@/components/page-shell";
import { createOffer } from "@/app/(member)/offers/new/actions";
import { OfferForm } from "@/components/offer-form";
import { requireOnboardedUser } from "@/lib/auth/require-onboarded-user";
import { db } from "@/lib/db";
import { District, OfferFormat } from "@/lib/generated/prisma/enums";
import { isOfferDuration } from "@/lib/offers/duration";
import { toKrakowLocal } from "@/lib/offers/krakow-time";
import { getCurrentSport } from "@/lib/sport/current-sport";
import { levelsFor } from "@/lib/sport/sport";

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
  // Slice PD1: the game is in the sport the header switcher shows, at one
  // of that sport's clubs.
  const sport = await getCurrentSport();
  const levels = levelsFor(sport);
  const clubs = await db.club.findMany({
    where: { sports: { has: sport } },
    select: { id: true, name: true, district: true },
    orderBy: { name: "asc" },
  });
  // "Create an offer at this club" (task 2.10) and "play again" (task Q.1)
  // both prefill the form through query params. A bad or unknown value is
  // simply ignored, same convention as clubId always had.
  const params = await searchParams;
  const param = (key: string) => {
    const raw = params[key];
    return Array.isArray(raw) ? raw[0] : raw;
  };
  const clubId = param("clubId");
  const district = param("district");
  const format = param("format");
  const durationMinutes = Number(param("durationMinutes"));
  const ntrpMin = Number(param("ntrpMin"));
  const ntrpMax = Number(param("ntrpMax"));
  const startsAt = param("startsAt");
  // "Play again" (task Q.2, after S1): the past opponent, carried through
  // as a hidden field so createOffer can invite them on save.
  const invite = z.uuid().safeParse(param("invite"));
  const inviteeId = invite.success ? invite.data : undefined;

  return (
    <SplitShell>
      <h1 className="text-3xl font-bold tracking-tight">
        {t(sport === "PADEL" ? "titlePadel" : "title")}
      </h1>
      <p className="mt-2 mb-6 text-muted-foreground">{t("subtitle")}</p>
      <OfferForm
        action={createOffer}
        sport={sport}
        authorGender={player.gender}
        clubs={clubs}
        defaultDistrict={
          Object.values(District).includes(district as District)
            ? (district as District)
            : player.district
        }
        defaultClubId={clubId}
        defaultFormat={
          Object.values(OfferFormat).includes(format as OfferFormat)
            ? (format as OfferFormat)
            : undefined
        }
        defaultDurationMinutes={
          isOfferDuration(durationMinutes) ? durationMinutes : undefined
        }
        defaultNtrpMin={levels.includes(ntrpMin) ? ntrpMin : undefined}
        defaultNtrpMax={levels.includes(ntrpMax) ? ntrpMax : undefined}
        defaultStartsAt={startsAt}
        defaultInviteeId={inviteeId}
        earliestStart={toKrakowLocal(new Date())}
      />
      <Link
        href="/offers"
        className="mt-4 block text-center text-sm text-muted-foreground hover:underline"
      >
        {t("cancel")}
      </Link>
    </SplitShell>
  );
}
