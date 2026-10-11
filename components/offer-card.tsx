import Link from "next/link";

import { SURFACE_LABELS } from "@/lib/clubs/surface-labels";
import type { FeedOffer } from "@/lib/offers/feed";
import { formatKrakowTime } from "@/lib/offers/krakow-time";
import {
  formatLabel,
  levelLabel,
  placeLabel,
  spotsLabel,
} from "@/lib/offers/offer-labels";

// One offer in the feed (3.6). The whole card links to the offer's page.
export function OfferCard({ offer }: { offer: FeedOffer }) {
  return (
    <Link
      href={`/offers/${offer.id}`}
      className="block rounded-lg border px-4 py-3 outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-medium">
          <time dateTime={offer.startsAt.toISOString()}>
            {formatKrakowTime(offer.startsAt)}
          </time>
          {" · "}
          {formatLabel(offer)}
        </span>
        <span className="shrink-0 text-sm font-medium text-primary">
          {spotsLabel(offer.spotsLeft)}
        </span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{placeLabel(offer)}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        {levelLabel(offer.ntrpMin, offer.ntrpMax)}
        {offer.surface && ` · ${SURFACE_LABELS[offer.surface]}`}
        {offer.author.name && ` · by ${offer.author.name}`}
      </p>
    </Link>
  );
}
