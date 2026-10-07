import type { Metadata } from "next";

import { ClubMap } from "@/components/club-map";

export const metadata: Metadata = { title: "Courts" };

// The map alone for now; club markers come in task 2.5, the list next to the
// map in 2.6–2.7.
export default function ClubsPage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Courts</h1>
      <p className="mt-2 text-muted-foreground">Club markers coming soon.</p>
      <ClubMap
        markers={[]}
        className="mt-6 h-[28rem] overflow-hidden rounded-lg border"
      />
    </main>
  );
}
