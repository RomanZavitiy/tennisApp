import { z } from "zod";

// What the browser's `PushSubscription.toJSON()` gives (task 5.15); the
// server action re-checks it the same way every other action re-checks its
// input, even though it only ever comes from lib/push/browser-subscribe.ts.

export const pushSubscriptionSchema = z.object({
  endpoint: z.url().max(500),
  p256dh: z.string().min(1).max(200),
  auth: z.string().min(1).max(200),
});

export type PushSubscriptionInput = z.infer<typeof pushSubscriptionSchema>;
