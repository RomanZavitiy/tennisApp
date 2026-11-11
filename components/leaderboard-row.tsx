import { useTranslations } from "next-intl";
import Link from "next/link";

import { InvitePlayerButton } from "@/components/invite-player-button";
import { PlayerAvatar } from "@/components/player-avatar";
import type { LeaderboardPlayer } from "@/lib/leaderboard/get-leaderboard";
import type { MyOpenOffer } from "@/lib/offers/my-open-offers";
import { DISTRICT_LABELS } from "@/lib/profile/options";
import { reliabilityLabel } from "@/lib/rating/reliability";
import { cn } from "@/lib/utils";

// One ranked player on the leaderboard (task L.5): rank, avatar + name
// linking to the public profile, district, ELO, matches played and a
// reliability badge — the same trust signals OfferCard shows for an author.
// "Invite to game" (task S1.4) sits below the link rather than inside it —
// a button can't nest inside the row's own <Link> to the profile.
export function LeaderboardRow({
  rank,
  player,
  myOpenOffers,
}: {
  rank: number;
  player: LeaderboardPlayer;
  /** The viewer's own open offers to invite this player into — null for a
   * guest or the player's own row, where "Invite" never shows. */
  myOpenOffers: MyOpenOffer[] | null;
}) {
  const t = useTranslations("LeaderboardRow");
  const tReliability = useTranslations("Reliability");

  return (
    <div className="space-y-2 rounded-xl border bg-card px-4 py-3 shadow-sm">
      <Link
        href={`/players/${player.id}`}
        className="flex items-center gap-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span
          className={cn(
            "inline-flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold tabular-nums",
            rank <= 3
              ? "bg-highlight text-highlight-foreground"
              : "text-muted-foreground",
          )}
        >
          {rank}
        </span>
        <PlayerAvatar
          name={player.name ?? t("aPlayer")}
          avatarPath={player.avatarPath}
          size={40}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium hover:underline">
            {player.name ?? t("aPlayer")}
          </p>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            {player.district && `${DISTRICT_LABELS[player.district]} · `}
            {t("matchesPlayed", { count: player.matchesPlayed })}
            {" · "}
            {reliabilityLabel(tReliability, player.reliability)}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-secondary px-2.5 py-1 text-sm font-semibold text-secondary-foreground tabular-nums">
          {t("elo", { elo: player.elo })}
        </span>
      </Link>
      {myOpenOffers && (
        <InvitePlayerButton
          targetUserId={player.id}
          offers={myOpenOffers}
          source="leaderboard"
        />
      )}
    </div>
  );
}
