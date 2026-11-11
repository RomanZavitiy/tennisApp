import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import type { ReactNode } from "react";

import { PageShell } from "@/components/page-shell";
import { BookingLink } from "@/components/booking-link";
import { ExternalLink } from "@/components/external-link";
import {
  FollowClubButton,
  SignInToFollowLink,
} from "@/components/follow-club-button";
import { OfferCard } from "@/components/offer-card";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/require-user";
import { getCoachesForClub } from "@/lib/coaches/get-coaches";
import {
  formatCheckedDate,
  getClub,
  getClubFollowInfo,
} from "@/lib/clubs/club-details";
import { getClubOffers } from "@/lib/offers/feed";
import { DISTRICT_LABELS } from "@/lib/profile/options";

// A club's page, open to everyone (it's in the proxy's public list). Empty
// fields mean "unknown" (decision 2.11) and are left out, not shown as "—".

// Typed by hand: Next's generated PageProps exist only after `next typegen`,
// and CI lints before that.
type ClubPageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({
  params,
}: ClubPageProps): Promise<Metadata> {
  const t = await getTranslations("ClubPage");
  const club = await getClub((await params).id);
  return { title: club?.name ?? t("notFound") };
}

export default async function ClubPage({ params }: ClubPageProps) {
  // Active offers (2.10) change all the time; never serve a cached page.
  await connection();
  const club = await getClub((await params).id);
  if (!club) {
    notFound();
  }
  const offers = await getClubOffers(club.id);
  const viewer = await getCurrentUser();
  const followInfo = await getClubFollowInfo(club.id, viewer?.id ?? null);
  const coaches = await getCoachesForClub(club.id);

  const t = await getTranslations("ClubPage");
  const tSurface = await getTranslations("Surface");
  const tIndoor = await getTranslations("IndoorCourts");
  const format = await getFormatter();

  const facts: { label: string; value: ReactNode }[] = [
    { label: t("courts"), value: String(club.courtCount) },
  ];
  if (club.surfaces.length > 0) {
    facts.push({
      label: t("surface"),
      value: club.surfaces.map((surface) => tSurface(surface)).join(", "),
    });
  }
  if (club.indoor) {
    facts.push({ label: t("indoor"), value: tIndoor(club.indoor) });
  }
  if (club.phone) {
    facts.push({
      label: t("phone"),
      value: (
        <a
          href={`tel:${club.phone.replaceAll(" ", "")}`}
          className="underline-offset-4 hover:underline"
        >
          {club.phone}
        </a>
      ),
    });
  }
  if (club.websiteUrl) {
    facts.push({
      label: t("website"),
      value: (
        <ExternalLink
          href={club.websiteUrl}
          className="break-all underline-offset-4 hover:underline"
        >
          {new URL(club.websiteUrl).hostname}
        </ExternalLink>
      ),
    });
  }

  return (
    <PageShell width="content">
      <Link
        href="/clubs"
        className="text-sm text-muted-foreground underline-offset-4 hover:underline"
      >
        {t("allCourts")}
      </Link>
      <h1 className="mt-4 text-3xl font-bold tracking-tight">{club.name}</h1>
      <p className="mt-1 text-muted-foreground">{club.address}</p>
      {club.district && (
        <p className="text-muted-foreground">
          {DISTRICT_LABELS[club.district]}
        </p>
      )}

      <div className="mt-4">
        {viewer ? (
          <FollowClubButton
            clubId={club.id}
            initialFollowing={followInfo.viewerFollows}
            initialFollowerCount={followInfo.followerCount}
          />
        ) : (
          <SignInToFollowLink clubId={club.id} />
        )}
        <Link
          href={`/clubs/${club.id}/chat`}
          className="mt-1 block text-sm underline-offset-4 hover:underline"
        >
          {t("clubChat")}
        </Link>
      </div>

      {club.bookingMode === "SPINBUDDY" ? (
        <Link
          href={`/clubs/${club.id}/book`}
          className={buttonVariants({ className: "mt-6" })}
        >
          {t("bookACourt")}
        </Link>
      ) : (
        <BookingLink
          clubId={club.id}
          bookingUrl={club.bookingUrl}
          phone={club.phone}
          className={buttonVariants({ className: "mt-6" })}
          urlLabel={t("bookACourt")}
          phoneLabel={t("callToBook")}
        />
      )}

      {/* Two columns on desktop (redesign): the club's facts on the left,
          who is looking for a partner here on the right. */}
      <div className="mt-8 grid gap-8 lg:grid-cols-2 lg:items-start">
        <div>
          <dl className="surface divide-y">
            {facts.map((fact) => (
              <div
                key={fact.label}
                className="flex justify-between gap-4 px-4 py-3"
              >
                <dt className="text-muted-foreground">{fact.label}</dt>
                <dd className="text-right font-medium">{fact.value}</dd>
              </div>
            ))}
          </dl>

          {club.priceInfo && (
            <section className="mt-6">
              <h2 className="font-semibold">{t("prices")}</h2>
              <p className="mt-1 whitespace-pre-line">{club.priceInfo}</p>
            </section>
          )}

          {coaches.length > 0 && (
            <section className="mt-6">
              <h2 className="font-semibold">{t("coachesHere")}</h2>
              <ul className="mt-1 space-y-1">
                {coaches.map((coach) => (
                  <li key={coach.slug}>
                    <Link
                      href={`/coaches#${coach.slug}`}
                      className="underline-offset-4 hover:underline"
                    >
                      {coach.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <p className="mt-8 text-sm text-muted-foreground">
            {t("checkedOn", {
              date: formatCheckedDate(format, club.verifiedAt),
            })}
          </p>
        </div>

        <section className="surface p-5">
          <h2 className="font-semibold">{t("lookingForPartnerHere")}</h2>
          {offers.length === 0 ? (
            <div className="mt-2 space-y-3">
              <p className="text-sm text-muted-foreground">{t("noOffers")}</p>
              <Link
                href={`/offers/new?clubId=${club.id}`}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                {t("createOfferHere")}
              </Link>
            </div>
          ) : (
            <ul className="mt-2 space-y-3">
              {offers.map((offer) => (
                <li key={offer.id}>
                  <OfferCard offer={offer} viewerId={viewer?.id ?? null} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </PageShell>
  );
}
