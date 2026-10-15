"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { updateNotificationSetting } from "@/app/(member)/profile/notifications/actions";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

// The three switches (task 5.3). Each posts its own new value the moment
// it's toggled — a slow save on one never blocks or clobbers a click on
// another the way one "Save" button for all three could.

export type NotificationSettings = {
  notifyMatches: boolean;
  notifyNewOffers: boolean;
  notifyEmailFallback: boolean;
};

const ROW_KEYS: (keyof NotificationSettings)[] = [
  "notifyMatches",
  "notifyNewOffers",
  "notifyEmailFallback",
];

export function NotificationSettingsForm({
  settings,
}: {
  settings: NotificationSettings;
}) {
  const t = useTranslations("NotificationSettingsForm");
  const [values, setValues] = useState(settings);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle(key: keyof NotificationSettings) {
    const next = !values[key];
    setValues((previous) => ({ ...previous, [key]: next }));
    setError(null);
    startTransition(async () => {
      const result = await updateNotificationSetting({ [key]: next });
      if (!result.ok) {
        // Undo the optimistic flip — the switch shows what's actually saved.
        setValues((previous) => ({ ...previous, [key]: !next }));
        setError(result.message);
      }
    });
  }

  return (
    <div className="space-y-5">
      {ROW_KEYS.map((key) => (
        <div key={key} className="flex items-start justify-between gap-4">
          <div>
            <Label htmlFor={key}>{t(`${key}.label`)}</Label>
            <p className="mt-1 text-sm text-muted-foreground">
              {t(`${key}.description`)}
            </p>
          </div>
          <Switch
            id={key}
            checked={values[key]}
            disabled={pending}
            onCheckedChange={() => {
              toggle(key);
            }}
          />
        </div>
      ))}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
