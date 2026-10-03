import { createBrowserClient } from "@supabase/ssr";

import { supabaseEnv } from "@/lib/supabase/env";

// Supabase client for client components. It reads the same session cookies
// the server sets. Only for what must run in the browser — sign-in, Storage
// uploads, Realtime; table data goes through Prisma on the server (task 1.2).
export function createSupabaseBrowserClient() {
  const { url, publishableKey } = supabaseEnv();
  return createBrowserClient(url, publishableKey);
}
