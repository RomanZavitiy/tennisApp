"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";

import { captureEvent } from "@/lib/analytics/posthog";
import { requireUser } from "@/lib/auth/require-user";
import { db } from "@/lib/db";
import { pushSubscriptionSchema } from "@/lib/validation/push-subscription";

export type ActionResult = { ok: true } | { ok: false; message: string };

// Saves a browser's subscription (task 5.15), straight after
// lib/push/browser-subscribe.ts's subscribeToPush() gets one. Upserts by
// endpoint — the same browser subscribing twice (a second visit, a second
// "Enable notifications" click) replaces its keys instead of adding a
// duplicate row; the unique index on endpoint is what makes that an upsert
// rather than a conflict.
export async function savePushSubscription(
  input: unknown,
): Promise<ActionResult> {
  const user = await requireUser();
  const t = await getTranslations("Errors");

  const parsed = pushSubscriptionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: t("invalidSubscription") };
  }

  // Checked before the upsert so "push_enabled" fires once per new
  // subscription, not again every time the browser silently re-registers
  // the same endpoint (e.g. after a service-worker update).
  const existed = await db.pushSubscription.findUnique({
    where: { endpoint: parsed.data.endpoint },
    select: { endpoint: true },
  });
  await db.pushSubscription.upsert({
    where: { endpoint: parsed.data.endpoint },
    create: { ...parsed.data, userId: user.id },
    update: { ...parsed.data, userId: user.id },
  });
  if (!existed) {
    await captureEvent("push_enabled", user.id, {});
  }

  revalidatePath("/profile/notifications");
  return { ok: true };
}

// Removes one subscription (task 5.15: "deleted on sign-out or when the
// user declines"). Scoped to the signed-in user's own rows — the endpoint
// is an unguessable push-service URL, but there's no reason to trust it
// without that check anyway.
export async function removePushSubscription(
  endpoint: unknown,
): Promise<ActionResult> {
  const user = await requireUser();
  const t = await getTranslations("Errors");

  const parsed = z.url().max(500).safeParse(endpoint);
  if (!parsed.success) {
    return { ok: false, message: t("invalidSubscription") };
  }

  await db.pushSubscription.deleteMany({
    where: { endpoint: parsed.data, userId: user.id },
  });

  revalidatePath("/profile/notifications");
  return { ok: true };
}

const notificationSettingsSchema = z.object({
  notifyMatches: z.boolean(),
  notifyNewOffers: z.boolean(),
  notifyEmailFallback: z.boolean(),
});

// The three switches (task 5.3). One setting at a time — each switch posts
// its own new value, so a slow save on one never clobbers a click on
// another the way a single "save all" form could.
export async function updateNotificationSetting(
  input: unknown,
): Promise<ActionResult> {
  const user = await requireUser();
  const t = await getTranslations("Errors");

  const parsed = notificationSettingsSchema.partial().safeParse(input);
  if (!parsed.success || Object.keys(parsed.data).length !== 1) {
    return { ok: false, message: t("invalidSetting") };
  }

  await db.user.update({ where: { id: user.id }, data: parsed.data });

  revalidatePath("/profile/notifications");
  return { ok: true };
}
