import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sparring offers" };

// Stub so the navigation has somewhere to go; the real page comes in Epic 3.
export default function OffersPage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Sparring offers</h1>
      <p className="mt-2 text-muted-foreground">Coming soon.</p>
    </main>
  );
}
