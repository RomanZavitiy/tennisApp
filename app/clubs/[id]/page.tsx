import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import type { ReactNode } from "react";

import { BookingLink } from "@/components/booking-link";
import { ExternalLink } from "@/components/external-link";
import { OfferCard } from "@/components/offer-card";
import { buttonVariants } from "@/components/ui/button";
import {
  formatCheckedDate,
  getClub,
  INDOOR_LABELS,
  SURFACE_LABELS,
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
  const club = await getClub((await params).id);
  return { title: club?.name ?? "Club not found" };
}

export default async function ClubPage({ params }: ClubPageProps) {
  // Active offers (2.10) change all the time; never serve a cached page.
  await connection();
  const club = await getClub((await params).id);
  if (!club) {
    notFound();
  }
  const offers = await getClubOffers(club.id);

  const facts: { label: string; value: ReactNode }[] = [
    { label: "Courts", value: String(club.courtCount) },
  ];
  if (club.surfaces.length > 0) {
    facts.push({
      label: "Surface",
      value: club.surfaces.map((surface) => SURFACE_LABELS[surface]).join(", "),
    });
  }
  if (club.indoor) {
    facts.push({ label: "Indoor", value: INDOOR_LABELS[club.indoor] });
  }
  if (club.phone) {
    facts.push({
      label: "Phone",
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
      label: "Website",
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
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-10">
      <Link
        href="/clubs"
        className="text-sm text-muted-foreground underline-offset-4 hover:underline"
      >
        ← All courts
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">
        {club.name}
      </h1>
      <p className="mt-1 text-muted-foreground">{club.address}</p>
      {club.district && (
        <p className="text-muted-foreground">
          {DISTRICT_LABELS[club.district]}
        </p>
      )}

      <BookingLink
        clubId={club.id}
        bookingUrl={club.bookingUrl}
        phone={club.phone}
        className={buttonVariants({ className: "mt-6" })}
        urlLabel="Book a court"
        phoneLabel="Call to book"
      />

      <dl className="mt-6 space-y-3">
        {facts.map((fact) => (
          <div key={fact.label} className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{fact.label}</dt>
            <dd className="text-right font-medium">{fact.value}</dd>
          </div>
        ))}
      </dl>

      {club.priceInfo && (
        <section className="mt-6">
          <h2 className="font-semibold">Prices</h2>
          <p className="mt-1 whitespace-pre-line">{club.priceInfo}</p>
        </section>
      )}

      <p className="mt-8 text-sm text-muted-foreground">
        Info checked on {formatCheckedDate(club.verifiedAt)}. Prices and hours
        change — confirm with the club before you go.
      </p>

      <section className="mt-8">
        <h2 className="font-semibold">Looking for a partner here</h2>
        {offers.length === 0 ? (
          <div className="mt-2 space-y-3">
            <p className="text-sm text-muted-foreground">
              No open offers at this club right now.
            </p>
            <Link
              href={`/offers/new?clubId=${club.id}`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Create an offer at this club
            </Link>
          </div>
        ) : (
          <ul className="mt-2 space-y-3">
            {offers.map((offer) => (
              <li key={offer.id}>
                <OfferCard offer={offer} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
