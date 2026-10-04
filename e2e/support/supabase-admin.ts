import { existsSync } from "node:fs";

import { createClient } from "@supabase/supabase-js";

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
