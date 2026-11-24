import { useTranslations } from "next-intl";
import Link from "next/link";

import { InvitePlayerButton } from "@/components/invite-player-button";
import { PlayerAvatar } from "@/components/player-avatar";
import { buttonVariants } from "@/components/ui/button";
import type { MyOpenOffer } from "@/lib/offers/my-open-offers";
import { intentInviteParams } from "@/lib/offers/play-intent";
import type { PlayIntentCard } from "@/lib/offers/play-intent-feed";
import { DISTRICT_LABELS } from "@/lib/profile/options";

/**
 * One "Шукають гру" card (slice U2, task U2.2). `myOpenOffers` is null for
 * the viewer's own card (no inviting yourself) — otherwise task U2.3's
 * "Запросити в мою гру" when there's an open offer to invite into, or
 * "Створити гру і запросити" with a prefilled form when there isn't.
 * Both pages that list these cards show one sport, the header switcher's
 * (slice PD2), so `myOpenOffers` and the prefilled form are in the card's
 * own sport. A padel card shows the padel level and no format: padel is
 * always doubles.
 */
export function IntentCard({
  intent,
  myOpenOffers,
}: {
  intent: PlayIntentCard;
  myOpenOffers: MyOpenOffer[] | null;
}) {
  const t = useTranslations("IntentCard");
  const tOfferFilters = useTranslations("OfferFilters");
  const tOfferLabels = useTranslations("OfferLabels");
  const isPadel = intent.sport === "PADEL";
  const { level } = intent.user;

  return (
    <li className="rounded-2xl border bg-card p-4 shadow-xs">
      <Link
        href={`/players/${intent.user.id}`}
        className="inline-flex items-center gap-2 font-semibold hover:underline"
      >
        <PlayerAvatar
          name={intent.user.name ?? t("aPlayer")}
          avatarPath={intent.user.avatarPath}
          size={32}
        />
        <span>
          {intent.user.name ?? t("aPlayer")}
          {level !== null &&
            (isPadel
              ? ` · ${t("padelLevel", { level })}`
              : ` · NTRP ${level.toFixed(1)}`)}
        </span>
      </Link>
      <p className="mt-1 text-sm text-muted-foreground">
        {t(isPadel ? "summaryPadel" : "summary", {
          date: intent.date,
          districts: intent.districts
            .map((district) => DISTRICT_LABELS[district])
            .join(", "),
          times: intent.times
            .map((time) => tOfferFilters(`time.${time}`))
            .join(", "),
          format:
            intent.format === "SINGLES"
              ? tOfferLabels("singles")
              : tOfferLabels("doubles"),
        })}
      </p>
      {intent.note && <p className="mt-1 text-sm">{intent.note}</p>}
      {myOpenOffers !== null && (
        <div className="mt-3">
          {myOpenOffers.length > 0 ? (
            <InvitePlayerButton
              targetUserId={intent.user.id}
              offers={myOpenOffers}
              source="intent"
            />
          ) : (
            <Link
              href={`/offers/new?${intentInviteParams({
                userId: intent.user.id,
                date: intent.date,
                times: intent.times,
                districts: intent.districts,
                format: intent.format,
              }).toString()}`}
              className={buttonVariants()}
            >
              {t("createAndInvite")}
            </Link>
          )}
        </div>
      )}
    </li>
  );
}
