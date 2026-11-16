import { useTranslations } from "next-intl";
import Link from "next/link";

import { PlayerAvatar } from "@/components/player-avatar";
import type { Sport } from "@/lib/generated/prisma/enums";
import type { OfferPlayer } from "@/lib/offers/offer-details";

// An offer's own player rows (task 3.13): avatar, name and NTRP, linking to
// the public profile. Shared by the player and author views of /offers/[id].
// On a padel offer (slice PD2) the level shown is the padel one.
export function PlayerLink({
  player,
  sport = "TENNIS",
}: {
  player: OfferPlayer;
  sport?: Sport;
}) {
  const padelLevel = player.padelLevel ?? null;
  const t = useTranslations("OfferPage");
  return (
    <Link
      href={`/players/${player.id}`}
      className="inline-flex items-center gap-1.5 hover:underline"
    >
      <PlayerAvatar
        name={player.name ?? t("aPlayer")}
        avatarPath={player.avatarPath}
        size={24}
      />
      <span>
        {player.name ?? t("aPlayer")}
        {sport === "PADEL"
          ? padelLevel !== null &&
            ` · ${t("padelLevel", { level: padelLevel })}`
          : player.selfRatedNtrp !== null &&
            ` · NTRP ${player.selfRatedNtrp.toFixed(1)}`}
      </span>
    </Link>
  );
}
