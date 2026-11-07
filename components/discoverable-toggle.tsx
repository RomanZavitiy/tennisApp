"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { updateDiscoverable } from "@/app/(member)/profile/actions";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

/** Opt out of "Кого запросити" (task S2.3, owner decision 2026-11-07:
 * defaults true) — the same immediate-save pattern as
 * NotificationSettingsForm's switches. */
export function DiscoverableToggle({
  discoverable,
}: {
  discoverable: boolean;
}) {
  const t = useTranslations("DiscoverableToggle");
  const [value, setValue] = useState(discoverable);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <Label htmlFor="discoverable">{t("label")}</Label>
        <p className="mt-1 text-sm text-muted-foreground">{t("description")}</p>
        {error && (
          <p role="alert" className="mt-1 text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
      <Switch
        id="discoverable"
        checked={value}
        disabled={pending}
        onCheckedChange={() => {
          const next = !value;
          setValue(next);
          setError(null);
          startTransition(async () => {
            const result = await updateDiscoverable(next);
            if (!result.ok) {
              setValue(!next);
              setError(result.message);
            }
          });
        }}
      />
    </div>
  );
}
