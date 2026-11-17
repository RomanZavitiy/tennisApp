"use client";

import { StarIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { addFavorite, removeFavorite } from "@/app/players/[id]/actions";
import { Button } from "@/components/ui/button";

// The favourite toggle (slice PD3, task PD3.4): optimistic, same shape as
// BlockPlayerButton. Shared by a player's profile and the "Favourite
// players" list on the viewer's own profile.
export function FavoritePlayerButton({
  targetUserId,
  initialFavorite,
}: {
  targetUserId: string;
  initialFavorite: boolean;
}) {
  const t = useTranslations("FavoritePlayerButton");
  const [favorite, setFavorite] = useState(initialFavorite);
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle() {
    const next = !favorite;
    setFavorite(next);
    setError(null);
    startTransition(async () => {
      const result = next
        ? await addFavorite(targetUserId)
        : await removeFavorite(targetUserId);
      if (!result.ok) {
        setFavorite(!next);
        setError(result.message);
      }
    });
  }

  return (
    <div className="space-y-1">
      <Button
        type="button"
        variant={favorite ? "secondary" : "outline"}
        size="sm"
        aria-pressed={favorite}
        onClick={toggle}
      >
        <StarIcon className={favorite ? "fill-current" : undefined} />
        {favorite ? t("remove") : t("add")}
      </Button>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
