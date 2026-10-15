"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";

import {
  removePushSubscription,
  savePushSubscription,
} from "@/app/(member)/profile/notifications/actions";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  hasActivePushSubscription,
  isIos,
  isStandalone,
  pushSupported,
  subscribeToPush,
  unsubscribeFromPushLocally,
} from "@/lib/push/browser-subscribe";

// Push notifications aren't just another setting toggle: they start from a
// browser permission prompt (task 5.15), which is why this is its own
// control, not a fourth row in NotificationSettingsForm. On iOS outside an
// installed PWA, there's no prompt to offer at all — a link to /install
// takes its place, per this session's prompt.

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

type Status = "checking" | "unsupported" | "needs-install" | "off" | "on";

// Synchronous and the same on the server as on the first client render
// (isIos/isStandalone/pushSupported all guard on `typeof window` — see
// lib/push/browser-subscribe.ts), so a lazy initializer is enough for these
// two cases; no hydration mismatch, no effect needed for them.
function initialStatus(): Status {
  if (isIos() && !isStandalone()) {
    return "needs-install";
  }
  if (!pushSupported()) {
    return "unsupported";
  }
  return "checking"; // still need the async check below
}

export function PushSubscribeControl() {
  const t = useTranslations("PushSubscribeControl");
  const [status, setStatus] = useState<Status>(initialStatus);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "checking") {
      return;
    }
    hasActivePushSubscription()
      .then((active) => {
        setStatus(active ? "on" : "off");
      })
      .catch(() => {
        setStatus("unsupported");
      });
  }, [status]);

  function enable() {
    if (!VAPID_PUBLIC_KEY) {
      setError(t("notSetUp"));
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await subscribeToPush(
        VAPID_PUBLIC_KEY,
        savePushSubscription,
        t,
      );
      if (result.ok) {
        setStatus("on");
      } else {
        setError(result.reason);
      }
    });
  }

  function disable() {
    setError(null);
    startTransition(async () => {
      const endpoint = await unsubscribeFromPushLocally();
      if (endpoint) {
        await removePushSubscription(endpoint);
      }
      setStatus("off");
    });
  }

  if (status === "checking") {
    return null;
  }

  if (status === "needs-install") {
    return (
      <p className="text-sm text-muted-foreground">
        <Link href="/install" className="underline underline-offset-4">
          {t("installTheApp")}
        </Link>{" "}
        {t("toGetNotificationsOnIphone")}
      </p>
    );
  }

  if (status === "unsupported") {
    return <p className="text-sm text-muted-foreground">{t("unsupported")}</p>;
  }

  return (
    <div className="space-y-1">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Label htmlFor="push-toggle">{t("pushNotifications")}</Label>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("getNotifiedOnThisDevice")}
          </p>
        </div>
        <Switch
          id="push-toggle"
          checked={status === "on"}
          disabled={pending}
          onCheckedChange={(checked) => {
            if (checked) {
              enable();
            } else {
              disable();
            }
          }}
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
