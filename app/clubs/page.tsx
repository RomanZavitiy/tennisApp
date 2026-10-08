import type { Metadata } from "next";
import { connection } from "next/server";

import { ClubMap } from "@/components/club-map";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Courts" };

// The map with a marker per club; the list next to it comes in 2.6–2.7.
export default async function ClubsPage() {
  // Read the clubs on each request, not at build time: CI builds without a
  // database, and a reloaded club file shows up without a redeploy.
  await connection();
  const clubs = await db.club.findMany({
    select: {
      id: true,
      name: true,
      address: true,
      latitude: true,
      longitude: true,
    },
    orderBy: { name: "asc" },
  });

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Courts</h1>
      <ClubMap
        markers={clubs}
        className="mt-6 h-[28rem] overflow-hidden rounded-lg border"
      />
    </main>
  );
}
