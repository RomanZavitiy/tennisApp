"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";

import { markCourtBooked } from "@/app/offers/[id]/actions";
import { BookingLink } from "@/components/booking-link";
import { OfferActionButton } from "@/components/offer-action-button";
import { buttonVariants } from "@/components/ui/button";
import type { BookingMode, CourtStatus } from "@/lib/generated/prisma/enums";
import { toKrakowLocal } from "@/lib/offers/krakow-time";
import { isBookingDuration } from "@/lib/validation/booking";

// The club link and booking CTA on an offer's page (tasks 3.13, 2.13, K.20).
// EXTERNAL_LINK: booking happens outside the app, so there's no server
// signal for "they clicked through and came back" — the "Booked the court?"
// banner shows the moment the link is clicked, author-only, unchanged by
// this slice. SPINBUDDY: the author instead gets a link straight into the
// grid (K.8), prefilled with this offer's own date and duration so the slot
// they already agreed to is a click away; requestBooking (K.21) stores the
// link back, and confirmBooking is what flips courtStatus this time, so
// there's no manual "mark as booked" banner here.
export function OfferBookingSection({
  offerId,
  club,
  isAuthor,
  courtStatus,
  startsAt,
  durationMinutes,
}: {
  offerId: string;
  club: {
    id: string;
    name: string;
    bookingMode: BookingMode;
    bookingUrl: string | null;
    phone: string | null;
  };
  isAuthor: boolean;
  courtStatus: CourtStatus;
  startsAt: Date;
  durationMinutes: number;
}) {
  const t = useTranslations("OfferBookingSection");
  const [clicked, setClicked] = useState(false);

  if (club.bookingMode === "SPINBUDDY") {
    const aboutClubLink = (
      <Link href={`/clubs/${club.id}`} className="hover:underline">
        {t("aboutClub", { name: club.name })}
      </Link>
    );
    if (!isAuthor) {
      return <div className="mt-3 text-sm">{aboutClubLink}</div>;
    }

    // Capped at the grid's own max — an offer can run longer (180 min, K5)
    // than a single booking request can.
    const duration = isBookingDuration(durationMinutes) ? durationMinutes : 120;
    const bookHref = `/clubs/${club.id}/book?${new URLSearchParams({
      date: toKrakowLocal(startsAt).slice(0, 10),
      duration: String(duration),
      offerId,
    }).toString()}`;

    return (
      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
        {aboutClubLink}
        {courtStatus === "BOOKED" ? (
          <span className="text-muted-foreground">{t("courtBooked")}</span>
        ) : (
          <Link
            href={bookHref}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            {t("bookACourtForThisGame")}
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="mt-3">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Link href={`/clubs/${club.id}`} className="hover:underline">
          {t("aboutClub", { name: club.name })}
        </Link>
        <BookingLink
          clubId={club.id}
          offerId={offerId}
          bookingUrl={club.bookingUrl}
          phone={club.phone}
          className={buttonVariants({ variant: "outline", size: "sm" })}
          urlLabel={t("bookOnClubSite")}
          phoneLabel={t("callToBook")}
          onClick={() => {
            setClicked(true);
          }}
        />
      </div>
      {isAuthor && courtStatus !== "BOOKED" && clicked && (
        <div className="mt-3 space-y-2 rounded-lg border p-3 text-sm">
          <p>{t("bookedTheCourt")}</p>
          <OfferActionButton
            action={markCourtBooked.bind(null, offerId)}
            label={t("markAsBooked")}
            pendingLabel={t("marking")}
          />
        </div>
      )}
    </div>
  );
}
