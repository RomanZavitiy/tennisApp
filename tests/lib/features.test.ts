import { afterEach, describe, expect, it } from "vitest";

import {
  features,
  isFeatureEnabled,
  isHiddenRoute,
  visibleLinks,
  type FeatureName,
} from "@/lib/features";
import { requireFeature } from "@/lib/require-feature";

const ALL: FeatureName[] = ["leaderboard", "coaches", "clubChat"];
const defaults = { ...features };

function setAll(enabled: boolean) {
  for (const feature of ALL) {
    features[feature] = enabled;
  }
}

afterEach(() => {
  Object.assign(features, defaults);
});

// The same list components/site-header.tsx hands to the desktop links and
// the mobile menu, and components/site-footer.tsx to its "Play" column.
const NAV = [
  { href: "/offers", label: "Sparring" },
  { href: "/clubs", label: "Courts" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/coaches", label: "Coaches" },
];

describe("feature flags", () => {
  it("ships with all three sections switched off", () => {
    expect(defaults).toEqual({
      leaderboard: false,
      coaches: false,
      clubChat: false,
    });
  });

  it("switches each section on its own", () => {
    features.coaches = true;

    expect(isFeatureEnabled("coaches")).toBe(true);
    expect(isFeatureEnabled("leaderboard")).toBe(false);
    expect(isHiddenRoute("/coaches")).toBe(false);
    expect(isHiddenRoute("/leaderboard")).toBe(true);
  });
});

describe("isHiddenRoute", () => {
  it.each([
    "/leaderboard",
    "/leaderboard?district=KROWODRZA",
    "/coaches",
    "/coaches#jan-kowalski",
    "/clubs/abc/chat",
  ])("%s is hidden while its section is off", (href) => {
    setAll(false);
    expect(isHiddenRoute(href)).toBe(true);
  });

  it.each(["/leaderboard", "/coaches#jan-kowalski", "/clubs/abc/chat"])(
    "%s is not hidden once its section is on",
    (href) => {
      setAll(true);
      expect(isHiddenRoute(href)).toBe(false);
    },
  );

  it.each([
    "/",
    "/offers",
    "/clubs",
    "/clubs/abc",
    "/clubs/abc/book",
    "/clubs/chat",
    "/profile",
  ])("%s is never hidden", (href) => {
    setAll(false);
    expect(isHiddenRoute(href)).toBe(false);
  });
});

describe("visibleLinks (header, mobile menu, footer, landing tiles)", () => {
  it("drops the links of switched-off sections", () => {
    setAll(false);
    expect(visibleLinks(NAV).map((link) => link.href)).toEqual([
      "/offers",
      "/clubs",
    ]);
  });

  it("keeps every link, in order, once the sections are on", () => {
    setAll(true);
    expect(visibleLinks(NAV)).toEqual(NAV);
  });
});

describe("requireFeature", () => {
  it.each(ALL)("answers 404 while %s is off", (feature) => {
    setAll(false);
    expect(() => {
      requireFeature(feature);
    }).toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
  });

  it.each(ALL)("lets the page render once %s is on", (feature) => {
    setAll(true);
    expect(() => {
      requireFeature(feature);
    }).not.toThrow();
  });
});
