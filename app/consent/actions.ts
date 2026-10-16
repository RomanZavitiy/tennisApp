"use server";

import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/require-user";
import { db } from "@/lib/db";
import { CURRENT_CONSENT_VERSION } from "@/lib/legal/consent";

// The existing-user consent screen (tasks 6.11, 6.12): a plain <form
// action>, no client JS needed for a single "I agree" button.
export async function giveConsent(): Promise<void> {
  const user = await requireUser();

  await db.user.update({
    where: { id: user.id },
    data: { consentedAt: new Date(), consentVersion: CURRENT_CONSENT_VERSION },
  });

  redirect("/");
}
