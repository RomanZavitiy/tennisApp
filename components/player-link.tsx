import { useTranslations } from "next-intl";
import Link from "next/link";

import { PlayerAvatar } from "@/components/player-avatar";
import type { OfferPlayer } from "@/lib/offers/offer-details";

// An offer's own player rows (task 3.13): avatar, name and NTRP, linking to
// the public profile. Shared by the player and author views of /offers/[id].
export function PlayerLink({ player }: { player: OfferPlayer }) {
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
        {player.selfRatedNtrp !== null &&
          ` · NTRP ${player.selfRatedNtrp.toFixed(1)}`}
      </span>
    </Link>
  );
}
