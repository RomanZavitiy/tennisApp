"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";

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
}: {
  action: () => Promise<{ ok: true } | { ok: false; message: string }>;
  label: string;
  confirmLabel?: string;
  pendingLabel: string;
  variant?: "default" | "outline";
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
