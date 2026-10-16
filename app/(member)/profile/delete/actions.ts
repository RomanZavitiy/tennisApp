"use server";

import { redirect } from "next/navigation";

import { requireOnboardedUser } from "@/lib/auth/require-onboarded-user";
import {
  deleteAccountStorageAndAuth,
  redactAccountData,
} from "@/lib/privacy/delete-account";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Self-service "Delete my account" (task 6.15), replacing the manual
// Supabase-Dashboard runbook — see decision 2026-10-16. Order is deliberate:
// DB redaction, then Storage/Auth, then sign-out — so a failure partway
// through leaves the more recoverable state (nulled-out but still logged in)
// rather than a deleted auth user whose data was never redacted.
export async function deleteMyAccount(): Promise<void> {
  const user = await requireOnboardedUser();

  await redactAccountData(user.id);
  await deleteAccountStorageAndAuth(user.id);

  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut({ scope: "local" });

  redirect("/account-deleted");
}
