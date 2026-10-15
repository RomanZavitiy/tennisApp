"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { markMeaningfulAction } from "@/lib/push/meaningful-action";

// A button that runs one server action on /offers/[id] (ask to join,
// withdraw, accept, decline). The action is already bound to its offer or
// join by the page; on success the action revalidates the page, so only a
// refusal needs showing here. With `confirmLabel`, the first click only asks
// for a second one — for actions that can't be undone, like cancelling.
export function OfferActionButton({
  action,
  label,
  confirmLabel,
  pendingLabel,
  variant = "default",
  trackMeaningfulAction = false,
}: {
  action: () => Promise<{ ok: true } | { ok: false; message: string }>;
  label: string;
  confirmLabel?: string;
  pendingLabel: string;
  variant?: "default" | "outline";
  /** Task 5.15: on "Ask to join" only — flags the first join request for
   * PushSubscribePrompt. A plain boolean, not a callback: the page that
   * renders this button is a Server Component, which can't pass a
   * client-only function like markMeaningfulAction as a prop. */
  trackMeaningfulAction?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="space-y-1">
      <Button
        type="button"
        variant={variant}
        disabled={pending}
        onClick={() => {
          if (confirmLabel && !confirming) {
            setConfirming(true);
            return;
          }
          startTransition(async () => {
            const result = await action();
            setMessage(result.ok ? null : result.message);
            if (result.ok && trackMeaningfulAction) {
              markMeaningfulAction();
            }
          });
        }}
      >
        {pending ? pendingLabel : confirming ? confirmLabel : label}
      </Button>
      {message && (
        <p role="alert" className="text-sm text-destructive">
          {message}
        </p>
      )}
    </div>
  );
}
