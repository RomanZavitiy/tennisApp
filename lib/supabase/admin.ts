import { createClient } from "@supabase/supabase-js";

// Service-role client for the two Supabase Admin API calls self-service
// account deletion needs (task 6.15): removing a player's own avatar files
// and deleting their own auth.users row. Neither is possible with the user's
// session JWT. Kept in its own module, separate from lib/supabase/server.ts
// and lib/supabase/env.ts, so the secret key has exactly one entry point —
// see decision 2026-10-16 (amends 1.2's RLS strategy) for why this narrow
// exception exists.
export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY must be set (see .env.example).",
    );
  }

  return createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
