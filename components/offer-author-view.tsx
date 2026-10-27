import { useTranslations } from "next-intl";

import { cancelBooking } from "@/app/clubs/[id]/book/actions";
import {
  acceptJoin,
  cancelOffer,
  declineJoin,
} from "@/app/offers/[id]/actions";
import { JoinThread } from "@/components/join-thread";
import { OfferActionButton } from "@/components/offer-action-button";
import { PlayerLink } from "@/components/player-link";
import { ResultSection } from "@/components/result-section";
import { canCancelOffer } from "@/lib/offers/cancel-rules";
import type { OfferDetails } from "@/lib/offers/offer-details";
import { reliabilityLabel } from "@/lib/rating/reliability";

// The author's view of their own offer (task 3.13): who's in, open requests
// with accept/decline, and cancel. Pulled out of page.tsx (K.20) so that
// file stays under the 500-line ceiling (AGENTS.md §6) — same reasoning as
// BookingSummaryCard's own split out of app/clubs/[id]/book/page.tsx.
export function AuthorView({
  details,
  started,
  viewerId,
}: {
  details: OfferDetails;
  started: boolean;
  viewerId: string;
}) {
  const t = useTranslations("OfferPage");
  const tReliability = useTranslations("Reliability");
  const requested = details.joins.filter((join) => join.status === "REQUESTED");
  const accepted = details.joins.filter((join) => join.status === "ACCEPTED");
  // A full, cancelled or past offer takes nobody more; the author can still
  // answer with "decline".
  const canAccept =
    details.spotsLeft > 0 && !started && details.offer.status === "OPEN";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-semibold">
          {t("playersIn", { count: accepted.length })}
        </h2>
        {accepted.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">{t("nobodyYet")}</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {accepted.map((join) => (
              <li key={join.id}>
                <PlayerLink player={join.user} />
                <JoinThread
                  offerJoinId={join.id}
                  viewerId={viewerId}
                  senderNames={{
                    [join.user.id]: join.user.name ?? t("aPlayer"),
                  }}
                />
                <ResultSection
                  join={join}
                  offer={details.offer}
                  party="AUTHOR"
                  opponentName={join.user.name ?? t("thePlayer")}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <h2 className="font-semibold">
          {t("requestsCount", { count: requested.length })}
        </h2>
        {requested.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            {t("noRequestsWaiting")}
          </p>
        ) : (
          <ul className="mt-2 divide-y rounded-lg border">
            {requested.map((join) => (
              <li key={join.id} className="px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <PlayerLink player={join.user} />
                    <p className="text-xs text-muted-foreground">
                      {reliabilityLabel(tReliability, join.user.reliability)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {canAccept && (
                      <OfferActionButton
                        action={acceptJoin.bind(null, join.id)}
                        label={t("accept")}
                        pendingLabel={t("accepting")}
                      />
                    )}
                    <OfferActionButton
                      action={declineJoin.bind(null, join.id)}
                      label={t("decline")}
                      pendingLabel={t("declining")}
                      variant="outline"
                    />
                  </div>
                </div>
                <JoinThread
                  offerJoinId={join.id}
                  viewerId={viewerId}
                  senderNames={{
                    [join.user.id]: join.user.name ?? t("aPlayer"),
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
      {canCancelOffer(details.offer, new Date()) && (
        <OfferActionButton
          action={cancelOffer.bind(null, details.offer.id)}
          label={t("cancelOfferLabel")}
          confirmLabel={t("confirmCancel")}
          pendingLabel={t("cancelling")}
          variant="outline"
        />
      )}
      {/* K.22: a separate, explicit action — cancelling the offer never
          touches the booking by itself. */}
      {details.offer.activeBooking && (
        <OfferActionButton
          action={cancelBooking.bind(null, details.offer.activeBooking.id)}
          label={t("cancelBookingTooLabel")}
          confirmLabel={t("confirmCancelBookingToo")}
          pendingLabel={t("cancellingBooking")}
          variant="outline"
        />
      )}
    </div>
  );
}
