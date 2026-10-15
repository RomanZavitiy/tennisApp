import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { connection } from "next/server";

import { ClubList } from "@/components/club-list";
import { ClubMap } from "@/components/club-map";
import { ClubsView } from "@/components/clubs-view";
import { db } from "@/lib/db";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("ClubsPage");
  return { title: t("title") };
}

// The club list and the map, read here and passed down as props: no client
// fetch. ClubsView keeps the two in sync (2.7).
export default async function ClubsPage() {
  // Read the clubs on each request, not at build time: CI builds without a
  // database, and a reloaded club file shows up without a redeploy.
  await connection();
  const clubs = await db.club.findMany({
    select: {
      id: true,
      name: true,
      address: true,
      district: true,
      latitude: true,
      longitude: true,
    },
    orderBy: { name: "asc" },
  });
  const t = await getTranslations("ClubsPage");

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
      <ClubsView
        list={<ClubList clubs={clubs} />}
        map={
          <ClubMap
            markers={clubs}
            className="h-full overflow-hidden rounded-lg border"
          />
        }
      />
    </main>
  );
}
