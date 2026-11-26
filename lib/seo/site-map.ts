import { visibleLinks } from "@/lib/features";

// What search engines may crawl (app/robots.ts) and which pages they are
// pointed at (app/sitemap.ts). Plain data and functions, no next/* or db
// imports, so both are unit-tested without a request.

/** Public pages that are the same for everyone. A section switched off in
 * lib/features.ts drops out, so the sitemap never lists a 404. */
const STATIC_PATHS = [
  "/",
  "/clubs",
  "/offers",
  "/leaderboard",
  "/install",
  "/terms",
  "/privacy",
];

/** Pages that are either private, one-off, or a 404 for most visitors.
 * Player profiles are public in the app but kept out of search results: a
 * player signed up to find a partner, not to have their name and level
 * show up on Google. */
export const DISALLOWED_PATHS = [
  "/admin",
  "/club/",
  "/api/",
  "/auth/",
  "/profile",
  "/notifications",
  "/onboarding",
  "/consent",
  "/unsubscribe",
  "/account-deleted",
  "/offers/new",
  "/players/",
];

export function isProductionDeployment(): boolean {
  return process.env.VERCEL_ENV === "production";
}

export type RobotsRules = {
  rules: { userAgent: string; allow?: string; disallow: string | string[] };
  sitemap?: string;
};

/** Production lets crawlers in except for the private paths. Every other
 * deployment (preview = staging data, local dev) is closed entirely, so a
 * preview URL someone shared never ends up indexed next to the real site. */
export function robotsRules(origin: string, production: boolean): RobotsRules {
  if (!production) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: { userAgent: "*", allow: "/", disallow: DISALLOWED_PATHS },
    sitemap: `${origin}/sitemap.xml`,
  };
}

export type SitemapEntry = {
  url: string;
  lastModified?: Date;
  changeFrequency?: "daily" | "weekly" | "monthly";
  priority?: number;
};

export function sitemapEntries(
  origin: string,
  clubs: { id: string; updatedAt: Date }[],
): SitemapEntry[] {
  const pages = visibleLinks(STATIC_PATHS.map((href) => ({ href }))).map(
    ({ href }): SitemapEntry => ({
      url: `${origin}${href === "/" ? "" : href}`,
      changeFrequency: href === "/offers" ? "daily" : "weekly",
      priority: href === "/" ? 1 : 0.7,
    }),
  );
  const clubPages = clubs.map((club): SitemapEntry => ({
    url: `${origin}/clubs/${club.id}`,
    lastModified: club.updatedAt,
    changeFrequency: "weekly",
    priority: 0.6,
  }));
  return [...pages, ...clubPages];
}
