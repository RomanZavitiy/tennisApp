import { useTranslations } from "next-intl";

import {
  joinWaitlist,
  leaveWaitlist,
} from "@/app/offers/[id]/waitlist-actions";
import { OfferActionButton } from "@/components/offer-action-button";
import type { WaitlistJoinRefusal } from "@/lib/offers/waitlist-rules";

/**
 * "Стати в резерв" (slice T, task T.2): on a FULL offer, instead of the
 * dead-end "no longer taking players" line. `position` comes from
 * getOfferDetails (null when the viewer isn't on the waitlist yet);
 * `refusal` is the same precheck requestToJoin's own UI already does
 * before letting the server have the final say.
 */
export function WaitlistSection({
  offerId,
  position,
  refusal,
}: {
  offerId: string;
  position: number | null;
  refusal: WaitlistJoinRefusal | null;
}) {
  const t = useTranslations("OfferPage");
  const tWaitlistRefusal = useTranslations("WaitlistRefusal");

  if (position !== null) {
    return (
      <div className="space-y-3">
        <p className="font-medium">{t("waitlistPosition", { position })}</p>
        <OfferActionButton
          action={leaveWaitlist.bind(null, offerId)}
          label={t("leaveWaitlist")}
          pendingLabel={t("leavingWaitlist")}
          variant="outline"
        />
      </div>
    );
  }

  // ALREADY_WAITLISTED never happens here — `position` above is null only
  // when there's truly no row, and this is the only thing that creates one.
  if (refusal) {
    return <p className="text-muted-foreground">{tWaitlistRefusal(refusal)}</p>;
  }
  return (
    <OfferActionButton
      action={joinWaitlist.bind(null, offerId)}
      label={t("joinWaitlist")}
      pendingLabel={t("joiningWaitlist")}
    />
  );
}
