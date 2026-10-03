// Supabase URL and publishable key, shared by the server and browser clients.
//
// Each variable is read by its full literal name: Next.js inlines
// NEXT_PUBLIC_* values into the client bundle only when written out like
// this, so `process.env[name]` would be undefined in the browser.
// The secret key is deliberately not read here — the app never uses it
// (see the RLS decision for task 1.2).

export function supabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must be set (see .env.example).",
    );
  }

  return { url, publishableKey };
}
