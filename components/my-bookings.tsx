import { useFormatter, useTranslations } from "next-intl";
import Link from "next/link";

import { cancelBooking } from "@/app/clubs/[id]/book/actions";
import { OfferActionButton } from "@/components/offer-action-button";
import type { MyBooking } from "@/lib/booking/my-bookings";
import { bookingDurationMinutes } from "@/lib/booking/duration";
import type { BookingStatus } from "@/lib/generated/prisma/enums";
import { formatKrakowTimeRange } from "@/lib/offers/krakow-time";
import { cn } from "@/lib/utils";

// The player's own bookings on their profile (K.13), grouped upcoming/past
// as the epic originally planned — pulled out of profile/page.tsx the same
// way MyGames was, so that page stays a thin list of cards.

const STATUS_STYLE: Record<BookingStatus, string> = {
  PENDING: "bg-secondary text-secondary-foreground",
  CONFIRMED: "bg-primary text-primary-foreground",
  DECLINED: "bg-destructive/10 text-destructive",
  CANCELLED: "bg-muted text-muted-foreground",
};

export function MyBookings({
  upcoming,
  past,
}: {
  upcoming: MyBooking[];
  past: MyBooking[];
}) {
  const t = useTranslations("MyBookings");

  if (upcoming.length === 0 && past.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("none")}</p>;
  }

  return (
    <div className="space-y-4">
      {upcoming.length > 0 && (
        <BookingGroup title={t("upcoming")} bookings={upcoming} />
      )}
      {past.length > 0 && <BookingGroup title={t("past")} bookings={past} />}
    </div>
  );
}

function BookingGroup({
  title,
  bookings,
}: {
  title: string;
  bookings: MyBooking[];
}) {
  const t = useTranslations("MyBookings");
  const format = useFormatter();

  return (
    <div>
      <h3 className="mb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {title}
      </h3>
      <ul className="divide-y">
        {bookings.map((booking) => (
          <li key={booking.id} className="py-3">
            <div className="flex items-center justify-between gap-3">
              <Link
                href={
                  booking.offerId
                    ? `/offers/${booking.offerId}`
                    : `/clubs/${booking.club.id}/book`
                }
                className="min-w-0 outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="block font-medium">
                  {formatKrakowTimeRange(
                    format,
                    booking.startsAt,
                    bookingDurationMinutes(booking.startsAt, booking.endsAt),
                  )}
                </span>
                <span className="block text-sm text-muted-foreground">
                  {t("courtAtClub", {
                    court: booking.court.name,
                    club: booking.club.name,
                  })}
                </span>
              </Link>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium",
                  STATUS_STYLE[booking.status],
                )}
              >
                {t(`status${booking.status}` as const)}
              </span>
            </div>
            {booking.status === "DECLINED" && booking.declineReason && (
              <p className="mt-1 text-sm text-muted-foreground">
                {t("declineReason", { reason: booking.declineReason })}
              </p>
            )}
            {booking.canCancel && (
              <div className="mt-2">
                <OfferActionButton
                  action={cancelBooking.bind(null, booking.id)}
                  label={t("cancel")}
                  confirmLabel={t("cancelConfirm")}
                  pendingLabel={t("cancelling")}
                  variant="outline"
                />
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
