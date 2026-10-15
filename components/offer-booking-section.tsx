"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";

import { markCourtBooked } from "@/app/offers/[id]/actions";
import { BookingLink } from "@/components/booking-link";
import { OfferActionButton } from "@/components/offer-action-button";
import { buttonVariants } from "@/components/ui/button";
import type { CourtStatus } from "@/lib/generated/prisma/enums";

// The club link and booking CTA on an offer's page (tasks 3.13, 2.13), plus
// a "Booked the court?" banner for the author alone. Booking happens outside
// the app — on the club's own site or by phone — so there is no server
// signal for "they clicked through and came back"; a new tab or a tel:
// prompt both leave this tab running, so showing the banner the moment the
// link is clicked is both the simplest option and an accurate one.
export function OfferBookingSection({
  offerId,
  club,
  isAuthor,
  courtStatus,
}: {
  offerId: string;
  club: {
    id: string;
    name: string;
    bookingUrl: string | null;
    phone: string | null;
  };
  isAuthor: boolean;
  courtStatus: CourtStatus;
}) {
  const t = useTranslations("OfferBookingSection");
  const [clicked, setClicked] = useState(false);

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
