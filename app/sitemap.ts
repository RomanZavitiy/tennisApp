import type { MetadataRoute } from "next";

import { db } from "@/lib/db";
import { appUrl } from "@/lib/notifications/app-url";
import { isProductionDeployment, sitemapEntries } from "@/lib/seo/site-map";

// Rebuilt at most once a day: clubs change through `pnpm clubs:load`, not
// by the minute.
export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Staging is closed to crawlers in robots.ts; no point listing its pages.
  if (!isProductionDeployment()) {
    return [];
  }
  const clubs = await db.club.findMany({
    // The booking-grid demo (docs/ROADMAP.md) isn't a real place to play.
    where: { slug: { not: "spinbuddy-demo-club" } },
    select: { id: true, updatedAt: true },
    orderBy: { name: "asc" },
  });
  return sitemapEntries(appUrl(), clubs);
}
