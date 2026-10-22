"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type AdminActionResult = { ok: true } | { ok: false; message: string };

export type AdminAction = {
  key: string;
  label: string;
  pendingLabel: string;
  variant?: "default" | "outline";
  run: (reason: string | undefined) => Promise<AdminActionResult>;
};

// One row's worth of queue buttons (task 6.3; reused by the club staff
// panel, K.17): a shared optional reason, and whichever actions apply to
// this row (dismiss/hide/block for a report, confirm/annul for a disputed
// result, a single unblock, or confirm/decline for a booking request) —
// one component behind /admin/reports, /admin/results and /club/[clubId].
// `reasonLabel` overrides the default "log" copy for a caller (the club
// panel) where the reason means something more specific to the player.
export function AdminActionForm({
  actions,
  reasonLabel,
}: {
  actions: readonly AdminAction[];
  reasonLabel?: string;
}) {
  const t = useTranslations("AdminActionForm");
  const [reason, setReason] = useState("");
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [, startTransition] = useTransition();

  if (done) {
    return <p className="text-sm text-muted-foreground">{t("done")}</p>;
  }

  const label = reasonLabel ?? t("reasonLabel");
  return (
    <div className="mt-2 space-y-2">
      <Textarea
        aria-label={label}
        value={reason}
        onChange={(event) => {
          setReason(event.target.value);
        }}
        rows={1}
        placeholder={label}
        className="text-sm"
      />
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <Button
            key={action.key}
            type="button"
            size="sm"
            variant={action.variant ?? "default"}
            disabled={pendingKey !== null}
            onClick={() => {
              setPendingKey(action.key);
              startTransition(async () => {
                const result = await action.run(reason.trim() || undefined);
                setPendingKey(null);
                if (result.ok) {
                  setDone(true);
                } else {
                  setMessage(result.message);
                }
              });
            }}
          >
            {pendingKey === action.key ? action.pendingLabel : action.label}
          </Button>
        ))}
      </div>
      {message && (
        <p role="alert" className="text-sm text-destructive">
          {message}
        </p>
      )}
    </div>
  );
}
