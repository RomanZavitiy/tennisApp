// Browser-side push subscribe/unsubscribe (task 5.15): plain Push API calls,
// plus the one conversion it needs (a VAPID public key, base64url, as the
// Uint8Array `applicationServerKey` wants) and the two server actions that
// persist the result. Everything here only runs in the browser — imported
// only from "use client" components.

export function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/** Already installed as a standalone app — Android's own flag, or iOS Safari's. */
export function isStandalone(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function isIos(): boolean {
  return (
    typeof navigator !== "undefined" &&
    /iphone|ipad|ipod/i.test(navigator.userAgent)
  );
}

/** A VAPID key as the browser's `pushManager.subscribe()` wants it: raw
 * bytes, not the base64url string it's handed out as. */
export function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Safe = (base64 + padding)
    .replaceAll("-", "+")
    .replaceAll("_", "/");
  // atob's output is a "binary string": one code unit per byte, never real
  // text — a plain index loop avoids the code-point/surrogate-pair
  // decomposition that spreading or splitting a string risks for anything
  // that is real text.
  const raw = atob(base64Safe);
  const bytes: Uint8Array<ArrayBuffer> = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    bytes[i] = raw.charCodeAt(i);
  }
  return bytes;
}

export type PushSubscriptionKeys = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

export type SubscribeOutcome = { ok: true } | { ok: false; reason: string };

/**
 * Asks for permission, subscribes with the service worker, and hands the
 * result to `save` (the server action) — the one place all three steps of
 * "turn on notifications" (5.15) happen together. `t` is a translator for
 * the "PushSubscribeControl" namespace (task 1.20).
 */
export async function subscribeToPush(
  publicKey: string,
  save: (subscription: PushSubscriptionKeys) => Promise<{ ok: boolean }>,
  t: (key: string) => string,
): Promise<SubscribeOutcome> {
  if (!pushSupported()) {
    return { ok: false, reason: t("notSupported") };
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return { ok: false, reason: t("permissionDenied") };
  }

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });
  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) {
    return { ok: false, reason: t("noUsableSubscription") };
  }

  const saved = await save({
    endpoint: json.endpoint,
    p256dh: json.keys.p256dh,
    auth: json.keys.auth,
  });
  return saved.ok ? { ok: true } : { ok: false, reason: t("couldNotSave") };
}

/** Unsubscribes locally and returns the endpoint that was removed, so the
 * caller can also delete the matching row (unsubscribeFromPush action). */
export async function unsubscribeFromPushLocally(): Promise<string | null> {
  if (!pushSupported()) {
    return null;
  }
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    return null;
  }
  const endpoint = subscription.endpoint;
  await subscription.unsubscribe();
  return endpoint;
}

/** Whether this browser already has an active push subscription. */
export async function hasActivePushSubscription(): Promise<boolean> {
  if (!pushSupported()) {
    return false;
  }
  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) {
    return false;
  }
  const subscription = await registration.pushManager.getSubscription();
  return subscription !== null;
}
