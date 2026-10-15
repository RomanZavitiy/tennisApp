import { useFormatter, useTranslations } from "next-intl";
import Link from "next/link";

import { PlayerAvatar } from "@/components/player-avatar";
import type { FeedOffer } from "@/lib/offers/feed";
import { formatKrakowTime } from "@/lib/offers/krakow-time";
import {
  formatLabel,
  levelLabel,
  placeLabel,
  spotsLabel,
} from "@/lib/offers/offer-labels";
import { DISTRICT_LABELS } from "@/lib/profile/options";
import { reliabilityLabel } from "@/lib/rating/reliability";

// One offer in the feed (3.6). The whole card links to the offer's page.
// The author's photo (task 1.14) builds trust between strangers — initials
// when they have none (PlayerAvatar).
export function OfferCard({ offer }: { offer: FeedOffer }) {
  const t = useTranslations("OfferLabels");
  const tSurface = useTranslations("Surface");
  const tCourtStatus = useTranslations("CourtStatus");
  const tReliability = useTranslations("Reliability");
  const tCard = useTranslations("OfferCard");
  const format = useFormatter();

  return (
    <Link
      href={`/offers/${offer.id}`}
      className="block rounded-lg border px-4 py-3 outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start gap-3">
        {offer.author.name && (
          <PlayerAvatar
            name={offer.author.name}
            avatarPath={offer.author.avatarPath}
            size={40}
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-medium">
              <time dateTime={offer.startsAt.toISOString()}>
                {formatKrakowTime(format, offer.startsAt)}
              </time>
              {" · "}
              {formatLabel(t, offer)}
            </span>
            <span className="shrink-0 text-sm font-medium text-primary">
              {spotsLabel(t, offer.spotsLeft)}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {placeLabel(
              offer,
              offer.district ? DISTRICT_LABELS[offer.district] : null,
            )}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {levelLabel(t, offer.ntrpMin, offer.ntrpMax)}
            {offer.surface && ` · ${tSurface(offer.surface)}`}
            {" · "}
            {tCourtStatus(offer.courtStatus)}
            {offer.author.name &&
              ` · ${tCard("byAuthor", { name: offer.author.name })} · ${reliabilityLabel(tReliability, offer.author.reliability)}`}
          </p>
        </div>
      </div>
    </Link>
  );
}
