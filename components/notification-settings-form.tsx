"use client";

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

const ROWS: {
  key: keyof NotificationSettings;
  label: string;
  description: string;
}[] = [
  {
    key: "notifyMatches",
    label: "Matches & messages",
    description:
      "Join requests, accept/decline, chat, court booked, match reminders.",
  },
  {
    key: "notifyNewOffers",
    label: "New offers for my level",
    description: "A new sparring offer near your district and NTRP level.",
  },
  {
    key: "notifyEmailFallback",
    label: "Email fallback",
    description:
      "Email you about key events when you have no active push subscription.",
  },
];

export function NotificationSettingsForm({
  settings,
}: {
  settings: NotificationSettings;
}) {
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
      {ROWS.map((row) => (
        <div key={row.key} className="flex items-start justify-between gap-4">
          <div>
            <Label htmlFor={row.key}>{row.label}</Label>
            <p className="mt-1 text-sm text-muted-foreground">
              {row.description}
            </p>
          </div>
          <Switch
            id={row.key}
            checked={values[row.key]}
            disabled={pending}
            onCheckedChange={() => {
              toggle(row.key);
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
