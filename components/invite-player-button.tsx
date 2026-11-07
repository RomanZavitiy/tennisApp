"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { inviteToOffer } from "@/app/offers/[id]/invite-actions";
import { Button } from "@/components/ui/button";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import type { InviteSource } from "@/lib/analytics/events";
import { formatKrakowTime } from "@/lib/offers/krakow-time";
import type { MyOpenOffer } from "@/lib/offers/my-open-offers";
import { DISTRICT_LABELS } from "@/lib/profile/options";

/**
 * "Invite to game" on a player's profile or the leaderboard (task S1.4):
 * pick one of the inviter's own open offers, then send the invite. Renders
 * a quiet "no open offers" line instead of a dead button when there's
 * nothing to invite into.
 */
export function InvitePlayerButton({
  targetUserId,
  offers,
  source,
}: {
  targetUserId: string;
  offers: MyOpenOffer[];
  source: Exclude<InviteSource, "candidates" | "playAgain">;
}) {
  const t = useTranslations("InvitePlayerButton");
  const format = useFormatter();
  const [offerId, setOfferId] = useState(offers[0]?.id ?? "");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  if (offers.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("noOpenOffers")}</p>;
  }
  if (sent) {
    return <p className="text-sm text-muted-foreground">{t("sent")}</p>;
  }

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-2">
        <NativeSelect
          className="w-auto"
          value={offerId}
          disabled={pending}
          onChange={(event) => {
            setOfferId(event.target.value);
          }}
        >
          {offers.map((offer) => (
            <NativeSelectOption key={offer.id} value={offer.id}>
              {formatKrakowTime(format, offer.startsAt)}
              {offer.club
                ? ` · ${offer.club.name}`
                : offer.district
                  ? ` · ${DISTRICT_LABELS[offer.district]}`
                  : ""}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <Button
          type="button"
          disabled={pending}
          onClick={() => {
            startTransition(async () => {
              const result = await inviteToOffer(offerId, targetUserId, source);
              if (result.ok) {
                setSent(true);
              } else {
                setMessage(result.message);
              }
            });
          }}
        >
          {pending ? t("sending") : t("invite")}
        </Button>
      </div>
      {message && (
        <p role="alert" className="text-sm text-destructive">
          {message}
        </p>
      )}
    </div>
  );
}
