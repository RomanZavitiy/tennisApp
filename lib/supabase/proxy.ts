import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { supabaseEnv } from "@/lib/supabase/env";

// Refreshes the Supabase session on every request and reports whether there
// is a signed-in user. Server Components can't write cookies, so this is the
// place where an expiring access token gets swapped for a new one.
//
// Refreshed cookies go both to the request (so the page rendered next already
// sees them) and to the response (so the browser stores them). Any redirect
// the caller builds must copy the response cookies too — see proxy.ts.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, publishableKey } = supabaseEnv();

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
        // Responses that set auth cookies must not be cached by a CDN.
        for (const [key, value] of Object.entries(headers)) {
          response.headers.set(key, value);
        }
      },
    },
  });

  // getClaims() verifies the token's signature, unlike getSession(), which
  // trusts whatever the cookie says. Nothing may run between creating the
  // client and this call, or a refresh could be lost.
  const { data } = await supabase.auth.getClaims();

  return { response, isSignedIn: Boolean(data?.claims) };
}
