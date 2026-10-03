import type { Metadata } from "next";

import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { LoginForm } from "@/components/login-form";
import { safeNextPath } from "@/lib/auth/routes";

export const metadata: Metadata = { title: "Sign in" };

// Props are typed by hand rather than with Next's generated PageProps: that
// type exists only after `next typegen`, and CI runs lint before it.
type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next, error } = await searchParams;
  const nextPath = safeNextPath(typeof next === "string" ? next : null);

  return (
    <main className="mx-auto w-full max-w-sm flex-1 px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-2 mb-6 text-muted-foreground">
        Use your Google account or get a link by email — no password needed.
      </p>
      {error === "link" && (
        <p
          role="alert"
          className="mb-6 rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
        >
          That sign-in link is invalid or has expired. Enter your email to get a
          new one.
        </p>
      )}
      <GoogleSignInButton next={nextPath} />
      <p className="my-6 text-center text-sm text-muted-foreground">
        or use your email
      </p>
      <LoginForm next={nextPath} />
    </main>
  );
}
