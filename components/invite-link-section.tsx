"use client";

import { LinkIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import {
  createInviteLink,
  revokeInviteLink,
} from "@/app/offers/[id]/invite-link-actions";
import { Button } from "@/components/ui/button";

const COPIED_LABEL_MS = 2000;

// The author's side of the invite link (slice PD3, task PD3.3): turn it
// on, copy it, replace it, turn it off. `token` is the offer's current
// one, sent only to its author; the page re-renders after each action, so
// this holds no copy of it.
export function InviteLinkSection({
  offerId,
  token,
}: {
  offerId: string;
  token: string | null;
}) {
  const t = useTranslations("InviteLinkSection");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function run(
    action: (id: string) => Promise<{ ok: boolean; message?: string }>,
  ) {
    setError(null);
    startTransition(async () => {
      const result = await action(offerId);
      if (!result.ok) {
        setError(result.message ?? null);
      }
    });
  }

  async function copy() {
    if (!token) return;
    const url = `${window.location.origin}/offers/${offerId}?invite=${token}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, COPIED_LABEL_MS);
  }

  return (
    <div className="space-y-2">
      <h2 className="font-semibold">{t("title")}</h2>
      <p className="text-sm text-muted-foreground">
        {token ? t("onHint") : t("offHint")}
      </p>
      <div className="flex flex-wrap gap-2">
        {token ? (
          <>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                void copy();
              }}
            >
              <LinkIcon />
              {copied ? t("copied") : t("copy")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() => {
                run(createInviteLink);
              }}
            >
              {t("replace")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={pending}
              onClick={() => {
                run(revokeInviteLink);
              }}
            >
              {t("turnOff")}
            </Button>
          </>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => {
              run(createInviteLink);
            }}
          >
            <LinkIcon />
            {t("turnOn")}
          </Button>
        )}
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
