"use server";

import { getTranslations } from "next-intl/server";

import { db } from "@/lib/db";
import { verifyUnsubscribeToken } from "@/lib/notifications/unsubscribe-token";

export type UnsubscribeResult = { ok: true } | { ok: false; message: string };

// The no-login "turn off email notifications" link from a fallback email
// (task 5.3). A forged or expired-looking token is refused the same way a
// missing one is — nothing here distinguishes "wrong signature" from
// "tampered with" for whoever's looking at the response.
export async function confirmUnsubscribe(
  token: unknown,
): Promise<UnsubscribeResult> {
  const t = await getTranslations("UnsubscribePage");

  if (typeof token !== "string") {
    return { ok: false, message: t("invalidLink") };
  }

  const userId = verifyUnsubscribeToken(token);
  if (!userId) {
    return { ok: false, message: t("invalidLink") };
  }

  // updateMany, not update: a token can outlive the account it names (6.15,
  // account deletion isn't built yet, but there's no reason to assume it
  // never will be) — zero rows matched is still a success from here, not a
  // crash.
  await db.user.updateMany({
    where: { id: userId },
    data: { notifyEmailFallback: false },
  });
  return { ok: true };
}
