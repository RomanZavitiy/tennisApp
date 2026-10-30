import { useTranslations } from "next-intl";
import Link from "next/link";

import { PlayerAvatar } from "@/components/player-avatar";
import type { LeaderboardPlayer } from "@/lib/leaderboard/get-leaderboard";
import { DISTRICT_LABELS } from "@/lib/profile/options";
import { reliabilityLabel } from "@/lib/rating/reliability";

// One ranked player on the leaderboard (task L.5): rank, avatar + name
// linking to the public profile, district, ELO, matches played and a
// reliability badge — the same trust signals OfferCard shows for an author.
export function LeaderboardRow({
  rank,
  player,
}: {
  rank: number;
  player: LeaderboardPlayer;
}) {
  const t = useTranslations("LeaderboardRow");
  const tReliability = useTranslations("Reliability");

  return (
    <Link
      href={`/players/${player.id}`}
      className="flex items-center gap-3 rounded-lg border px-4 py-3 outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="w-6 shrink-0 text-right text-sm font-medium text-muted-foreground">
        {rank}
      </span>
      <PlayerAvatar
        name={player.name ?? t("aPlayer")}
        avatarPath={player.avatarPath}
        size={40}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{player.name ?? t("aPlayer")}</p>
        <p className="mt-0.5 truncate text-sm text-muted-foreground">
          {player.district && `${DISTRICT_LABELS[player.district]} · `}
          {t("matchesPlayed", { count: player.matchesPlayed })}
          {" · "}
          {reliabilityLabel(tReliability, player.reliability)}
        </p>
      </div>
      <span className="shrink-0 font-semibold">
        {t("elo", { elo: player.elo })}
      </span>
    </Link>
  );
}
