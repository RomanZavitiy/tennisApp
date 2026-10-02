import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sign in" };

// Stub so the navigation has somewhere to go; the real page comes in task 1.6.
export default function LoginPage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-2 text-muted-foreground">Coming soon.</p>
    </main>
  );
}
