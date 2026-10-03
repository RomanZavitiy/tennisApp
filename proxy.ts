import { NextResponse, type NextRequest } from "next/server";

import { isPublicRoute } from "@/lib/auth/routes";
import { updateSession } from "@/lib/supabase/proxy";

// Runs before every page: keeps the session fresh and sends signed-out users
// from protected pages to /login?next=<where they were going>.
// This guards pages only. Server actions are separate POST endpoints and must
// check the user themselves (requireUser, task 1.5).
export async function proxy(request: NextRequest) {
  const { response, isSignedIn } = await updateSession(request);
  const { pathname, search } = request.nextUrl;

  if (isSignedIn || isPublicRoute(pathname)) {
    return response;
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", pathname + search);
  const redirect = NextResponse.redirect(loginUrl);
  for (const cookie of response.cookies.getAll()) {
    redirect.cookies.set(cookie);
  }
  return redirect;
}

export const config = {
  matcher: [
    // Skip Next.js internals and static files: they need no session, and
    // redirecting them would break CSS, JS and images on public pages.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)",
  ],
};
