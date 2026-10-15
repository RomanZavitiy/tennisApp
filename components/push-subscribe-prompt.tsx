"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";

import { savePushSubscription } from "@/app/(member)/profile/notifications/actions";
import { Button } from "@/components/ui/button";
import {
  hasActivePushSubscription,
  isIos,
  isStandalone,
  pushSupported,
  subscribeToPush,
} from "@/lib/push/browser-subscribe";
import { hasMeaningfulAction } from "@/lib/push/meaningful-action";

// "Ask for notification permission only after a meaningful action, never on
// first load" (task 5.15). Mounted on every member page (the (member)
// layout); hasMeaningfulAction() — set by MarkMeaningfulAction (the first
// offer) or OfferActionButton's trackMeaningfulAction (the first join
// request) — is what actually decides whether it shows anything at all.

const DISMISSED_KEY = "mf:push-prompt-dismissed";

function dismissed(): boolean {
  try {
    return localStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

function dismiss(): void {
  try {
    localStorage.setItem(DISMISSED_KEY, "1");
  } catch {
    // Nothing to persist — the prompt may reappear next visit, which is a
    // minor annoyance, not a bug worth more code for.
  }
}

type Visibility = "hidden" | "checking" | "ask" | "install-hint";

function initialVisibility(): Visibility {
  if (!hasMeaningfulAction() || dismissed()) {
    return "hidden";
  }
  if (isIos() && !isStandalone()) {
    return "install-hint";
  }
  if (
    !pushSupported() ||
    typeof Notification === "undefined" ||
    Notification.permission !== "default"
  ) {
    // Already decided (granted/denied) or this browser can't do push at
    // all — nothing to ask, same reasoning as /profile/notifications'
    // own PushSubscribeControl.
    return "hidden";
  }
  return "checking"; // might already be subscribed from another prompt
}

export function PushSubscribePrompt() {
  const [visibility, setVisibility] = useState<Visibility>(initialVisibility);
  const [pending, startTransition] = useTransition();
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  useEffect(() => {
    if (visibility !== "checking") {
      return;
    }
    hasActivePushSubscription()
      .then((active) => {
        setVisibility(active ? "hidden" : "ask");
      })
      .catch(() => {
        setVisibility("hidden");
      });
  }, [visibility]);

  function enable() {
    if (!vapidPublicKey) {
      setVisibility("hidden");
      return;
    }
    startTransition(async () => {
      // Granted and saved, or denied/failed — either way there's nothing
      // more useful to say here than on the settings page itself, which
      // the player can always revisit.
      await subscribeToPush(vapidPublicKey, savePushSubscription);
      setVisibility("hidden");
    });
  }

  function hide() {
    dismiss();
    setVisibility("hidden");
  }

  if (visibility === "hidden" || visibility === "checking") {
    return null;
  }

  if (visibility === "install-hint") {
    return (
      <div
        role="status"
        className="flex items-center justify-between gap-4 border-b bg-muted px-4 py-3 text-sm"
      >
        <p>
          <Link href="/install" className="underline underline-offset-4">
            Install the app
          </Link>{" "}
          to get notifications on iPhone.
        </p>
        <button
          type="button"
          onClick={hide}
          aria-label="Dismiss"
          className="text-muted-foreground"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div
      role="status"
      className="flex items-center justify-between gap-4 border-b bg-muted px-4 py-3 text-sm"
    >
      <p>Turn on notifications for new requests and messages?</p>
      <div className="flex shrink-0 gap-2">
        <Button type="button" size="sm" disabled={pending} onClick={enable}>
          {pending ? "Enabling…" : "Enable"}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={hide}>
          Not now
        </Button>
      </div>
    </div>
  );
}
