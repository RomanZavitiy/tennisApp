"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { ensureUserRow } from "@/lib/auth/ensure-user-row";
import { getCurrentUser } from "@/lib/auth/require-user";
import { safeNextPath } from "@/lib/auth/routes";
import { checkRateLimit } from "@/lib/rate-limit/check-rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  loginCodeRequestSchema,
  magicLinkRequestSchema,
} from "@/lib/validation/login";

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

export type VerifyLoginCodeResult = { ok: false; message: string };

// Signs in with the one-time code from the sign-in email, in the tab the
// player started in — the email's button opens a new window, which is what
// this is for. Same ending as /auth/callback: a verified email, a users
// row, then on to `next`. Returns only on failure; success is a redirect.
export async function verifyLoginCode(
  input: unknown,
): Promise<VerifyLoginCodeResult> {
  const t = await getTranslations("Validation.login");
  const tErrors = await getTranslations("Errors");

  const parsed = loginCodeRequestSchema(t).safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? tErrors("invalidRequest"),
    };
  }
  const { email, code, next } = parsed.data;

  // A code is only digits, so guessing has to be capped: 5 tries an hour
  // per email, ahead of Supabase's own per-IP limit (every call here comes
  // from our server, not the player's IP). It shares MAGIC_LINK's window
  // and limit under a "code:" subject of its own, so a wrong code never
  // eats into the emails a player can ask for — and no enum migration.
  const limited = await checkRateLimit(
    `code:${email.toLowerCase()}`,
    "MAGIC_LINK",
  );
  if (!limited.ok) {
    return { ok: false, message: tErrors("tooManyCodeAttempts") };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token: code,
    type: "email",
  });
  if (error || !data.user?.email) {
    return { ok: false, message: tErrors("codeRejected") };
  }

  await ensureUserRow(data.user.id, data.user.email);
  redirect(safeNextPath(next));
}

// The other way out of the "check your email" step: the player pressed the
// button in the email after all, which signed them in in another tab of the
// same browser. When they come back to this tab it asks here, and moves on
// instead of sitting on a form that is no longer needed.
export async function continueIfSignedIn(next: unknown): Promise<void> {
  if (await getCurrentUser()) {
    redirect(safeNextPath(typeof next === "string" ? next : null));
  }
}
