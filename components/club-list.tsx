"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useRef } from "react";

import { BookingLink } from "@/components/booking-link";
import { useClubSelection } from "@/components/club-selection";
import { buttonVariants } from "@/components/ui/button";
import type { District } from "@/lib/generated/prisma/enums";
import { DISTRICT_LABELS } from "@/lib/profile/options";
import { cn } from "cn";

export type ClubListItem = {
  id: string;
  name: string;
  address: string;
  district: District | null;
  bookingUrl: string | null;
  phone: string | null;
  /** Open, upcoming offers at this club — players looking for a partner. */
  openOffers: number;
};

// The clubs next to the map on the home page's court search. Clicking a club
// shows it on the map (2.7); "Details" leads to the club's page. Each club
// also gets the two things a player came for (slice K4): booking a court at
// the club itself (the app has no booking, decision 2026-09-20), and finding
// someone to play with there — its open offers, or posting the first one.
export function ClubList({
  clubs,
  filtered = false,
}: {
  clubs: ClubListItem[];
  filtered?: boolean;
}) {
  const t = useTranslations("ClubList");
  const clubSelection = useClubSelection();

  if (clubs.length === 0) {
    return (
      <p className="text-muted-foreground">
        {filtered ? t("noneMatchFilters") : t("noClubsYet")}{" "}
        <Link
          href="/clubs/suggest"
          className="underline-offset-4 hover:underline"
        >
          {t("suggestClub")}
        </Link>
      </p>
    );
  }

  const selection = clubSelection?.selection;
  return (
    <ul className="divide-y rounded-xl border bg-card shadow-sm">
      {clubs.map((club) => (
        <ClubListEntry
          key={club.id}
          club={club}
          selected={selection?.id === club.id}
          // Scroll only for a marker click: a club clicked here is in view.
          scrollIntoView={selection?.id === club.id && selection.from === "map"}
          onSelect={() => clubSelection?.select(club.id, "list")}
        />
      ))}
    </ul>
  );
}

function ClubListEntry({
  club,
  selected,
  scrollIntoView,
  onSelect,
}: {
  club: ClubListItem;
  selected: boolean;
  scrollIntoView: boolean;
  onSelect: () => void;
}) {
  const t = useTranslations("ClubList");
  const ref = useRef<HTMLLIElement>(null);

  useEffect(() => {
    // "nearest" scrolls the list box just enough and leaves the page alone
    // when the club is already in view.
    if (scrollIntoView) {
      ref.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [scrollIntoView]);

  return (
    <li ref={ref} className={cn("px-4 py-3", selected && "bg-muted")}>
      <div className="flex items-start gap-3">
        <button
          type="button"
          aria-pressed={selected}
          onClick={onSelect}
          className="min-w-0 flex-1 rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="block font-medium">{club.name}</span>
          <span className="block text-sm text-muted-foreground">
            {club.address}
          </span>
          {club.district && (
            <span className="block text-sm text-muted-foreground">
              {DISTRICT_LABELS[club.district]}
            </span>
          )}
        </button>
        <Link
          href={`/clubs/${club.id}`}
          aria-label={t("detailsAriaLabel", { name: club.name })}
          className="shrink-0 text-sm underline-offset-4 hover:underline"
        >
          {t("details")}
        </Link>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <BookingLink
          clubId={club.id}
          bookingUrl={club.bookingUrl}
          phone={club.phone}
          className={buttonVariants({ size: "sm" })}
          urlLabel={t("bookACourt")}
          phoneLabel={t("callToBook")}
        />
        {club.openOffers > 0 ? (
          <Link
            href={`/clubs/${club.id}`}
            className={buttonVariants({ size: "sm", variant: "secondary" })}
          >
            {t("playersLooking", { count: club.openOffers })}
          </Link>
        ) : (
          <Link
            href={`/offers/new?clubId=${club.id}`}
            className={buttonVariants({ size: "sm", variant: "outline" })}
          >
            {t("findAPartner")}
          </Link>
        )}
      </div>
    </li>
  );
}
