import { useFormatter, useTranslations } from "next-intl";

import { requestBooking } from "@/app/clubs/[id]/book/actions";
import { OfferActionButton } from "@/components/offer-action-button";
import { toKrakowLocal } from "@/lib/offers/krakow-time";
import type { BookingDuration } from "@/lib/validation/booking";

// The selection summary + "Send request" on the booking grid (K.8, K.11) —
// pulled out of book/page.tsx so that page stays under the 500-line
// ceiling (AGENTS.md §6) as the grid itself grows. Fully server-rendered
// except for OfferActionButton's own pending state.
export function BookingSummaryCard({
  clubName,
  court,
  startsAt,
  duration,
  fits,
  offerId,
}: {
  clubName: string;
  court: { id: string; name: string; pricePerHourPln: number | null };
  startsAt: Date;
  duration: BookingDuration;
  fits: boolean;
  /** K.20: set when this page was reached from an offer's "book a court" link. */
  offerId?: string;
}) {
  const t = useTranslations("BookPage");
  const format = useFormatter();

  return (
    <section className="mt-6 rounded-lg border p-4">
      <h2 className="font-semibold">{t("summaryTitle")}</h2>
      {fits ? (
        <>
          <dl className="mt-2 space-y-1.5 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">{t("summaryClub")}</dt>
              <dd className="text-right font-medium">{clubName}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">{t("summaryCourt")}</dt>
              <dd className="text-right font-medium">{court.name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">{t("summaryDate")}</dt>
              <dd className="text-right font-medium">
                {format.dateTime(startsAt, {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">{t("summaryTime")}</dt>
              <dd className="text-right font-medium">
                {format.dateTime(startsAt, {
                  hour: "2-digit",
                  minute: "2-digit",
                  hourCycle: "h23",
                })}
                –
                {format.dateTime(
                  new Date(startsAt.getTime() + duration * 60_000),
                  { hour: "2-digit", minute: "2-digit", hourCycle: "h23" },
                )}
              </dd>
            </div>
            {court.pricePerHourPln != null && (
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{t("summaryPrice")}</dt>
                <dd className="text-right font-medium">
                  {t("pricePerHour", { price: court.pricePerHourPln })}
                </dd>
              </div>
            )}
          </dl>
          <div className="mt-4">
            <OfferActionButton
              action={requestBooking.bind(null, {
                courtId: court.id,
                startsAt: toKrakowLocal(startsAt),
                duration,
                offerId,
              })}
              label={t("sendRequest")}
              pendingLabel={t("sending")}
            />
          </div>
        </>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">
          {t("doesntFit", { duration })}
        </p>
      )}
    </section>
  );
}
