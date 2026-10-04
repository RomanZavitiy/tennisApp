"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

// Starts Google sign-in. Runs in the browser because Supabase sends the user
// straight on to Google; the browser client also stores the PKCE verifier in
// a cookie, which /auth/callback needs to exchange the returned code.
// The return address uses the current origin, so a preview deployment comes
// back to itself (it must be in Supabase's Redirect URLs).
export function GoogleSignInButton({ next }: { next: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    setPending(true);
    setError(null);

    const redirectTo = new URL("/auth/callback", window.location.origin);
    redirectTo.searchParams.set("next", next);

    const { error } = await createSupabaseBrowserClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectTo.toString() },
    });

    // On success the browser is already leaving for Google.
    if (error) {
      setError("Couldn't start Google sign-in. Try again in a minute.");
      setPending(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={pending}
        onClick={() => void signIn()}
      >
        Continue with Google
      </Button>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
