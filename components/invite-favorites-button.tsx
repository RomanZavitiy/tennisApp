"use client";

import { StarIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { inviteFavorites } from "@/app/offers/[id]/favorite-actions";
import { Button } from "@/components/ui/button";

// "Invite my favourites" on the author's own open game (slice PD3, task
// PD3.4): one click sends the usual invite to every favourite who can still
// be invited, and says how many went out.
export function InviteFavoritesButton({ offerId }: { offerId: string }) {
  const t = useTranslations("InviteFavoritesButton");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  function invite() {
    setMessage(null);
    startTransition(async () => {
      const result = await inviteFavorites(offerId);
      setFailed(!result.ok);
      setMessage(
        result.ok ? t("invited", { count: result.invited }) : result.message,
      );
    });
  }

  return (
    <div className="space-y-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={invite}
      >
        <StarIcon />
        {pending ? t("inviting") : t("invite")}
      </Button>
      {message && (
        <p
          role={failed ? "alert" : "status"}
          className={
            failed
              ? "text-sm text-destructive"
              : "text-sm text-muted-foreground"
          }
        >
          {message}
        </p>
      )}
    </div>
  );
}
