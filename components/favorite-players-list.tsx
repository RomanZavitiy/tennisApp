"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";

import { FavoritePlayerButton } from "@/components/favorite-player-button";
import { PlayerAvatar } from "@/components/player-avatar";
import type { FavoritePlayer } from "@/lib/players/favorites";

// The profile's "Favourite players" list (slice PD3, task PD3.4): who gets
// "invite my favourites", and whose new games the player hears about.
export function FavoritePlayersList({
  players,
}: {
  players: FavoritePlayer[];
}) {
  const t = useTranslations("FavoritePlayersList");

  if (players.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("none")}</p>;
  }

  return (
    <ul className="divide-y">
      {players.map((player) => (
        <li
          key={player.id}
          className="flex items-center justify-between gap-3 py-3"
        >
          <Link
            href={`/players/${player.id}`}
            className="inline-flex items-center gap-1.5 hover:underline"
          >
            <PlayerAvatar
              name={player.name ?? t("aPlayer")}
              avatarPath={player.avatarPath}
              size={24}
            />
            {player.name ?? t("aPlayer")}
          </Link>
          <FavoritePlayerButton targetUserId={player.id} initialFavorite />
        </li>
      ))}
    </ul>
  );
}
