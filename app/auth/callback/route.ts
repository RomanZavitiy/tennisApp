import { NextResponse, type NextRequest } from "next/server";

import { parseCallbackParams } from "@/lib/auth/callback";
import { ensureUserRow } from "@/lib/auth/ensure-user-row";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Turns a sign-in link (magic link or Google) into a session cookie, then
// sends the user to where they were going. A bad or expired link goes back to
// the login page with a message instead of an error page.
export async function GET(request: NextRequest) {
  const { origin, searchParams } = request.nextUrl;
  const params = parseCallbackParams(searchParams);

  if (params.kind !== "invalid") {
    const supabase = await createSupabaseServerClient();
    const { data, error } =
      params.kind === "code"
        ? await supabase.auth.exchangeCodeForSession(params.code)
        : await supabase.auth.verifyOtp({
            type: params.type,
            token_hash: params.tokenHash,
          });

    if (!error && data.user) {
      // A database failure here surfaces as an error page rather than a
      // signed-in user without a row.
      await ensureUserRow(data.user.id);
      return NextResponse.redirect(new URL(params.next, origin));
    }
  }

  const loginUrl = new URL("/login", origin);
  loginUrl.searchParams.set("error", "link");
  loginUrl.searchParams.set("next", params.next);
  return NextResponse.redirect(loginUrl);
}
