"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { blockPlayer, unblockPlayer } from "@/app/players/[id]/actions";
import { Button } from "@/components/ui/button";

// The block toggle (slice R, task R.3): optimistic, same reasoning as
// FollowClubButton — the only way it can fail server-side is a race the
// viewer can't do anything about (the player's account is gone).
// Shared by the player profile, the profile's own "blocked players" list,
// and a join thread's header.
export function BlockPlayerButton({
  targetUserId,
  initialBlocked,
}: {
  targetUserId: string;
  initialBlocked: boolean;
}) {
  const t = useTranslations("BlockPlayerButton");
  const [blocked, setBlocked] = useState(initialBlocked);
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle() {
    const next = !blocked;
    setBlocked(next);
    setError(null);
    startTransition(async () => {
      const result = next
        ? await blockPlayer(targetUserId)
        : await unblockPlayer(targetUserId);
      if (!result.ok) {
        setBlocked(!next);
        setError(result.message);
      }
    });
  }

  return (
    <div className="space-y-1">
      <Button
        type="button"
        variant={blocked ? "outline" : "ghost"}
        size="sm"
        onClick={toggle}
      >
        {blocked ? t("unblock") : t("block")}
      </Button>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
