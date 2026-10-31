"use client";

import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import Link from "next/link";
import { useState, useTransition } from "react";

import { PlayerAvatar } from "@/components/player-avatar";
import { Button } from "@/components/ui/button";
import type { FeedOffer } from "@/lib/offers/feed";
import { dismissOffer, undismissOffer } from "@/lib/offers/dismissals/actions";
import { formatKrakowTimeRange } from "@/lib/offers/krakow-time";
import {
  formatLabel,
  levelLabel,
  placeLabel,
  spotsLabel,
} from "@/lib/offers/offer-labels";
import { DISTRICT_LABELS } from "@/lib/profile/options";
import { reliabilityLabel } from "@/lib/rating/reliability";
import { cn } from "@/lib/utils";

// One offer in the feed (3.6). The whole card links to the offer's page.
// The author's photo (task 1.14) builds trust between strangers — initials
// when they have none (PlayerAvatar). The viewer's own offers are marked
// (slice K1) so they stand out in the shared list.
export function OfferCard({
  offer,
  viewerId = null,
  dismissed = false,
}: {
  offer: FeedOffer;
  viewerId?: string | null;
  /** Rendering the hidden-offers view (slice N): "Unhide" instead of "Hide". */
  dismissed?: boolean;
}) {
  const t = useTranslations("OfferLabels");
  const tSurface = useTranslations("Surface");
  const tCourtStatus = useTranslations("CourtStatus");
  const tReliability = useTranslations("Reliability");
  const tCard = useTranslations("OfferCard");
  const format = useFormatter();
  const isOwn = viewerId !== null && offer.author.id === viewerId;

  // Hide/unhide (slice N): removed from the visible list on click, no
  // reload — rolled back if the server call turns out not to have landed.
  const [removed, setRemoved] = useState(false);
  const [, startTransition] = useTransition();

  if (removed) {
    return null;
  }

  function toggleDismissal(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    setRemoved(true);
    startTransition(async () => {
      const action = dismissed ? undismissOffer : dismissOffer;
      const result = await action(offer.id);
      if (!result.ok) {
        setRemoved(false);
      }
    });
  }

  return (
    <Link
      href={`/offers/${offer.id}`}
      className={cn(
        "relative block rounded-lg border px-4 py-3 outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
        isOwn && "border-primary",
      )}
    >
      {viewerId && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute top-2 right-2"
          onClick={toggleDismissal}
        >
          {dismissed ? <EyeIcon /> : <EyeOffIcon />}
          <span className="sr-only">
            {dismissed ? tCard("unhide") : tCard("hide")}
          </span>
        </Button>
      )}
      <div className={cn("flex items-start gap-3", viewerId && "pr-8")}>
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
                {formatKrakowTimeRange(
                  format,
                  offer.startsAt,
                  offer.durationMinutes,
                )}
              </time>
              {" · "}
              {formatLabel(t, offer)}
            </span>
            <span className="shrink-0 text-sm font-medium text-primary">
              {spotsLabel(t, offer.spotsLeft)}
            </span>
          </div>
          {isOwn && (
            <span className="mt-1 inline-block rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
              {tCard("yourOffer")}
            </span>
          )}
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
