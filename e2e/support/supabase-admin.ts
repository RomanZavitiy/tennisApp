import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Supabase admin client for e2e tests only (see the sign-in decision for task
// 1.1). It uses SUPABASE_SECRET_KEY, which bypasses RLS — so it lives under
// e2e/, which the app never imports, and the key is never set in Vercel.
// Playwright doesn't read .env.local itself; locally the key comes from
// there, in CI from the environment.

if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    throw new Error(
      "E2E sign-in needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY (see .env.example).",
    );
  }

  return createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Test users are recognizable by email, so leftovers from an aborted run can
// be found and removed (see global-teardown.ts).
export const TEST_EMAIL_PREFIX = "e2e-";
export const TEST_EMAIL_DOMAIN = "@example.com";

// Signing in creates a row in our `users` table (task 1.9). It has no foreign
// key to auth.users, so deleting the auth user alone would leave it behind.
// The secret key bypasses RLS, which lets the Data API delete it.
// Their photos (task 1.13) go too, so the bucket doesn't fill with test files.
export async function deleteTestUser(
  admin: ReturnType<typeof createAdminClient>,
  id: string,
) {
  const avatars = admin.storage.from("avatars");
  const { data: files } = await avatars.list(id);
  if (files?.length) {
    await avatars.remove(files.map((file) => `${id}/${file.name}`));
  }

  const { error } = await admin.from("users").delete().eq("id", id);
  if (error) throw error;
  await admin.auth.admin.deleteUser(id);
}

// Fills in a test user's profile as if they had finished onboarding, for
// tests of member pages that aren't about onboarding itself.
export async function completeTestProfile(
  admin: ReturnType<typeof createAdminClient>,
  id: string,
  profile: Record<string, unknown> = {},
) {
  const { error } = await admin
    .from("users")
    .update({
      name: "Ola",
      birth_date: "1995-04-12",
      gender: "FEMALE",
      district: "KROWODRZA",
      self_rated_ntrp: 3.5,
      onboarding_completed_at: new Date().toISOString(),
      ...profile,
    })
    .eq("id", id);
  if (error) throw error;
}

// A client like the browser's: publishable key, no session (role "anon").
export function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

// A browser-like client signed in as a fresh test user (role
// "authenticated"), via the same magic-link token the sign-in fixture uses.
// The caller deletes the user afterwards with deleteTestUser.
export async function createSignedInClient(
  admin: ReturnType<typeof createAdminClient>,
): Promise<{ id: string; client: SupabaseClient }> {
  const email = `${TEST_EMAIL_PREFIX}${randomUUID()}${TEST_EMAIL_DOMAIN}`;
  const { data: userData, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
  });
  if (error) throw error;

  const { data: link, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  if (linkError) throw linkError;

  const client = createPublicClient();
  const { error: otpError } = await client.auth.verifyOtp({
    type: "magiclink",
    token_hash: link.properties.hashed_token,
  });
  if (otpError) throw otpError;

  return { id: userData.user.id, client };
}
