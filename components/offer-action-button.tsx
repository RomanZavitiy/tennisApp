"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";

// A button that runs one server action on /offers/[id] (ask to join,
// withdraw, accept, decline). The action is already bound to its offer or
// join by the page; on success the action revalidates the page, so only a
// refusal needs showing here.
export function OfferActionButton({
  action,
  label,
  pendingLabel,
  variant = "default",
}: {
  action: () => Promise<{ ok: true } | { ok: false; message: string }>;
  label: string;
  pendingLabel: string;
  variant?: "default" | "outline";
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="space-y-1">
      <Button
        type="button"
        variant={variant}
        disabled={pending}
        onClick={() => {
          startTransition(async () => {
            const result = await action();
            setMessage(result.ok ? null : result.message);
          });
        }}
      >
        {pending ? pendingLabel : label}
      </Button>
      {message && (
        <p role="alert" className="text-sm text-destructive">
          {message}
        </p>
      )}
    </div>
  );
}
