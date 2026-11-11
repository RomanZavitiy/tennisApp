// Sections that look dead while there are few players, hidden until roughly
// 50 are active (hidden 2026-11-11). Constants, not env variables: a flag
// flips in one reviewed commit, and preview and production can't drift apart
// because someone set a variable in only one of them. How to turn each one
// back on: docs/ROADMAP.md.
//
// A hidden section has no links leading to it, its page answers 404 for
// guests and members alike (lib/require-feature.ts), and its server actions
// refuse. No next/* imports here: the proxy loads this file too.
export const features: Record<FeatureName, boolean> = {
  /** /leaderboard */
  leaderboard: false,
  /** /coaches, and "Coaches at this club" on a club's page */
  coaches: false,
  /** /clubs/[id]/chat and its send/report actions */
  clubChat: false,
};

export type FeatureName = "leaderboard" | "coaches" | "clubChat";

export function isFeatureEnabled(feature: FeatureName): boolean {
  return features[feature];
}

const FEATURE_ROUTES: { feature: FeatureName; route: RegExp }[] = [
  { feature: "leaderboard", route: /^\/leaderboard$/ },
  { feature: "coaches", route: /^\/coaches$/ },
  { feature: "clubChat", route: /^\/clubs\/[^/]+\/chat$/ },
];

/** Whether a path or link (query and #hash ignored) leads into a section
 * that is switched off. Used to drop links and by the proxy's gate. */
export function isHiddenRoute(href: string): boolean {
  const pathname = href.split(/[?#]/, 1)[0] ?? "";
  return FEATURE_ROUTES.some(
    ({ feature, route }) => route.test(pathname) && !isFeatureEnabled(feature),
  );
}

/** The links of a list that don't lead into a switched-off section. */
export function visibleLinks<T extends { href: string }>(links: T[]): T[] {
  return links.filter((link) => !isHiddenRoute(link.href));
}
