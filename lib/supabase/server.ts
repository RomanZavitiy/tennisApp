import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { supabaseEnv } from "@/lib/supabase/env";

// Supabase client for Server Components, server actions and route handlers.
// The session lives in cookies, so create a new client per request — never
// share one between requests.
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const { url, publishableKey } = supabaseEnv();

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components can't set cookies. That's fine as long as the
          // proxy (task 1.4) refreshes the session on every request.
        }
      },
    },
  });
}
