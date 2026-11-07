import { useTranslations } from "next-intl";
import Link from "next/link";

import { InvitePlayerButton } from "@/components/invite-player-button";
import { PlayerAvatar } from "@/components/player-avatar";
import { buttonVariants } from "@/components/ui/button";
import type { District, OfferFormat } from "@/lib/generated/prisma/enums";
import type { TimeOfDay } from "@/lib/offers/feed-filters";
import type { MyOpenOffer } from "@/lib/offers/my-open-offers";
import { intentInviteParams } from "@/lib/offers/play-intent";
import { DISTRICT_LABELS } from "@/lib/profile/options";

export type IntentCardData = {
  id: string;
  date: string;
  times: TimeOfDay[];
  districts: District[];
  format: OfferFormat;
  note: string | null;
  user: {
    id: string;
    name: string | null;
    avatarPath: string | null;
    selfRatedNtrp: number | null;
  };
};

/**
 * One "Шукають гру" card (slice U2, task U2.2). `myOpenOffers` is null for
 * the viewer's own card (no inviting yourself) — otherwise task U2.3's
 * "Запросити в мою гру" when there's an open offer to invite into, or
 * "Створити гру і запросити" with a prefilled form when there isn't.
 */
export function IntentCard({
  intent,
  myOpenOffers,
}: {
  intent: IntentCardData;
  myOpenOffers: MyOpenOffer[] | null;
}) {
  const t = useTranslations("IntentCard");
  const tOfferFilters = useTranslations("OfferFilters");
  const tOfferLabels = useTranslations("OfferLabels");

  return (
    <li className="rounded-lg border px-4 py-3">
      <Link
        href={`/players/${intent.user.id}`}
        className="inline-flex items-center gap-1.5 hover:underline"
      >
        <PlayerAvatar
          name={intent.user.name ?? t("aPlayer")}
          avatarPath={intent.user.avatarPath}
          size={24}
        />
        <span>
          {intent.user.name ?? t("aPlayer")}
          {intent.user.selfRatedNtrp !== null &&
            ` · NTRP ${intent.user.selfRatedNtrp.toFixed(1)}`}
        </span>
      </Link>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("summary", {
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
