"use client";

import { useTranslations } from "next-intl";

import { BlockPlayerButton } from "@/components/block-player-button";
import { PlayerAvatar } from "@/components/player-avatar";
import type { BlockedPlayer } from "@/lib/moderation/personal-block";

// The profile's "Blocked players" list (slice R, task R.3): the one place
// to undo a block, since blockedCounterpartIds (lib/moderation/personal-
// block.ts) only ever hides offers and threads — it never surfaces a way
// back on its own.
export function BlockedPlayersList({ players }: { players: BlockedPlayer[] }) {
  const t = useTranslations("BlockedPlayersList");

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
          <span className="inline-flex items-center gap-1.5">
            <PlayerAvatar
              name={player.name ?? t("aPlayer")}
              avatarPath={player.avatarPath}
              size={24}
            />
            {player.name ?? t("aPlayer")}
          </span>
          <BlockPlayerButton targetUserId={player.id} initialBlocked />
        </li>
      ))}
    </ul>
  );
}
