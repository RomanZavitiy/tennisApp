"use server";

import { z } from "zod";

import { captureEvent } from "@/lib/analytics/posthog";
import { getCurrentUser } from "@/lib/auth/require-user";
import { db } from "@/lib/db";

// Logs a click on a club's booking link or phone number (task 2.13), from
// the club's own page or an offer's page. Fire-and-forget by design: the
// caller never awaits this, it just lets the browser navigate — so this
// never throws, not even for a bad id, and the result is never shown.
export async function recordOutboundClick(input: unknown): Promise<void> {
  const parsed = z
    .object({
      clubId: z.uuid(),
      target: z.enum(["URL", "PHONE"]),
      offerId: z.uuid().optional(),
    })
    .safeParse(input);
  if (!parsed.success) {
    return;
  }

  try {
    const user = await getCurrentUser();
    await db.outboundClick.create({
      data: { ...parsed.data, userId: user?.id ?? null },
    });
    // Guest clicks still count for the owner's own query (2.13) but have no
    // id to attach an event to — anonymous, so skipped here, not sent with
    // a made-up distinctId.
    if (user) {
      await captureEvent("booking_outbound_clicked", user.id, {
        target: parsed.data.target,
      });
    }
  } catch {
    // A log write failing is never the player's problem to see.
  }
}
