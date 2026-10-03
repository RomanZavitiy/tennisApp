// Which pages need a signed-in user, and where to send them after sign-in.
// Used by the proxy (proxy.ts) and, from task 1.6, by the login page.

// Pages open to everyone. Everything else needs a session: a page forgotten
// here shows up as an unexpected redirect to /login, while a protected page
// forgotten in a "protected" list would silently leak — so the list is of
// public pages. A new public page must be added here.
const PUBLIC_ROUTES = [
  /^\/$/,
  /^\/login$/,
  /^\/auth\/.+$/,
  /^\/clubs(\/[^/]+)?$/,
  /^\/offers$/,
  /^\/players\/[^/]+$/,
];

export function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.some((route) => route.test(pathname));
}

// The `next` query parameter comes from the URL, so anyone can craft a link
// like /login?next=https://evil.example. Only a path on this site is
// accepted; anything else falls back to the home page. Resolving against a
// dummy origin also catches tricks like "//evil.example" or "/\evil.example",
// which browsers treat as other hosts.
const DUMMY_ORIGIN = "http://localhost";

export function safeNextPath(next: string | null | undefined) {
  if (!next?.startsWith("/")) {
    return "/";
  }

  const url = new URL(next, DUMMY_ORIGIN);
  if (url.origin !== DUMMY_ORIGIN) {
    return "/";
  }

  return url.pathname + url.search + url.hash;
}
