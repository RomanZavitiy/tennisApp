import { afterEach, describe, expect, it, vi } from "vitest";

import { features } from "@/lib/features";
import {
  DISALLOWED_PATHS,
  isProductionDeployment,
  robotsRules,
  sitemapEntries,
} from "@/lib/seo/site-map";

const ORIGIN = "https://spinbuddy.pl";

describe("robotsRules", () => {
  it("closes every non-production deployment to crawlers", () => {
    expect(robotsRules(ORIGIN, false)).toEqual({
      rules: { userAgent: "*", disallow: "/" },
    });
  });

  it("opens production except the private paths, and points at the sitemap", () => {
    const robots = robotsRules(ORIGIN, true);
    expect(robots.rules.allow).toBe("/");
    expect(robots.rules.disallow).toEqual(DISALLOWED_PATHS);
    expect(robots.sitemap).toBe("https://spinbuddy.pl/sitemap.xml");
  });

  it("keeps admin, staff panels and player profiles out of search", () => {
    expect(DISALLOWED_PATHS).toEqual(
      expect.arrayContaining(["/admin", "/club/", "/players/", "/profile"]),
    );
  });
});

describe("isProductionDeployment", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is true only on Vercel's production environment", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    expect(isProductionDeployment()).toBe(true);
    vi.stubEnv("VERCEL_ENV", "preview");
    expect(isProductionDeployment()).toBe(false);
    vi.stubEnv("VERCEL_ENV", undefined);
    expect(isProductionDeployment()).toBe(false);
  });
});

describe("sitemapEntries", () => {
  afterEach(() => {
    features.leaderboard = false;
  });

  it("lists the public pages and one entry per club", () => {
    const updatedAt = new Date("2026-11-12T10:00:00Z");
    const entries = sitemapEntries(ORIGIN, [{ id: "c1", updatedAt }]);
    const urls = entries.map((entry) => entry.url);

    expect(urls).toContain("https://spinbuddy.pl");
    expect(urls).toContain("https://spinbuddy.pl/clubs");
    expect(urls).toContain("https://spinbuddy.pl/offers");
    expect(entries.at(-1)).toEqual({
      url: "https://spinbuddy.pl/clubs/c1",
      lastModified: updatedAt,
      changeFrequency: "weekly",
      priority: 0.6,
    });
  });

  it("leaves out a section switched off in lib/features.ts", () => {
    const urls = () => sitemapEntries(ORIGIN, []).map((entry) => entry.url);

    expect(urls()).not.toContain("https://spinbuddy.pl/leaderboard");
    features.leaderboard = true;
    expect(urls()).toContain("https://spinbuddy.pl/leaderboard");
  });

  it("never lists a private path", () => {
    const urls = sitemapEntries(ORIGIN, []).map((entry) =>
      entry.url.replace(ORIGIN, ""),
    );
    for (const url of urls) {
      expect(DISALLOWED_PATHS.some((path) => url.startsWith(path))).toBe(false);
    }
  });
});
