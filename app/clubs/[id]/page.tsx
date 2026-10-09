import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { buttonVariants } from "@/components/ui/button";
import {
  formatCheckedDate,
  getClub,
  INDOOR_LABELS,
  SURFACE_LABELS,
} from "@/lib/clubs/club-details";
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
  const club = await getClub((await params).id);
  if (!club) {
    notFound();
  }

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

      {club.bookingUrl && (
        <ExternalLink
          href={club.bookingUrl}
          className={buttonVariants({ className: "mt-6" })}
        >
          Book a court
        </ExternalLink>
      )}

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
    </main>
  );
}

// The club's own site, in a new tab. noopener: the new page gets no handle
// on this one; noreferrer: the club doesn't learn which page sent the player.
function ExternalLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className ?? "underline-offset-4 hover:underline"}
    >
      {children}
    </a>
  );
}
