"use server";

import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";

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
  const t = await getTranslations("Validation.login");
  const tErrors = await getTranslations("Errors");
  const tRateLimit = await getTranslations("RateLimit");

  const parsed = magicLinkRequestSchema(t).safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? tErrors("invalidRequest"),
    };
  }

  const origin = (await headers()).get("origin");
  if (!origin) {
    return { ok: false, message: tErrors("invalidRequest") };
  }

  // Own pre-check (task 6.16, decision 2026-10-14): 5 magic links an hour
  // per email, ahead of Supabase's own request — friendlier, and keyed by
  // the email the form sent rather than whatever Supabase's limit keys by.
  const limited = await checkRateLimit(parsed.data.email, "MAGIC_LINK");
  if (!limited.ok) {
    return { ok: false, message: tRateLimit("MAGIC_LINK") };
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
          ? tErrors("tooManySignInEmails")
          : tErrors("couldNotSendSignInLink"),
    };
  }

  return { ok: true };
}
