"use server";

import { headers } from "next/headers";

import { safeNextPath } from "@/lib/auth/routes";
import { checkRateLimit } from "@/lib/rate-limit/check-rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { magicLinkRequestSchema } from "@/lib/validation/login";

export type SendMagicLinkResult = { ok: true } | { ok: false; message: string };

// Emails a sign-in link. The link returns to /auth/callback on the same
// deployment the user is on (localhost, a preview or production), so the
// origin comes from the request. Supabase only accepts origins from its
// Redirect URLs list; Next.js already rejects server action calls whose
// Origin doesn't match the host.
export async function sendMagicLink(
  input: unknown,
): Promise<SendMagicLinkResult> {
  const parsed = magicLinkRequestSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Invalid request.",
    };
  }

  const origin = (await headers()).get("origin");
  if (!origin) {
    return { ok: false, message: "Invalid request." };
  }

  // Own pre-check (task 6.16, decision 2026-10-14): 5 magic links an hour
  // per email, ahead of Supabase's own request — friendlier, and keyed by
  // the email the form sent rather than whatever Supabase's limit keys by.
  const limited = await checkRateLimit(parsed.data.email, "MAGIC_LINK");
  if (!limited.ok) {
    return limited;
  }

  const redirectTo = new URL("/auth/callback", origin);
  redirectTo.searchParams.set("next", safeNextPath(parsed.data.next));

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: { emailRedirectTo: redirectTo.toString() },
  });

  if (error) {
    return {
      ok: false,
      message:
        error.status === 429
          ? "Too many sign-in emails. Wait a minute and try again."
          : "Couldn't send the sign-in link. Try again in a minute.",
    };
  }

  return { ok: true };
}
