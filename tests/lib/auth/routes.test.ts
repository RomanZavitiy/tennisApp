import { afterEach, describe, expect, it } from "vitest";

import { isPublicRoute, safeNextPath } from "@/lib/auth/routes";
import { features } from "@/lib/features";

describe("isPublicRoute", () => {
  it.each([
    "/",
    "/login",
    "/auth/callback",
    "/clubs",
    "/clubs/abc",
    "/clubs/abc/book",
    "/offers",
    "/offers/44444444-4444-4444-8444-444444444444",
    "/players/abc",
    "/leaderboard",
    "/install",
    "/unsubscribe",
    "/admin",
    "/admin/reports",
    "/club/abc",
  ])("%s is public", (path) => {
    expect(isPublicRoute(path)).toBe(true);
  });

  it.each([
    "/profile",
    "/profile/edit",
    "/profile/notifications",
    "/onboarding",
    "/players",
    "/clubs/a/b",
    "/clubs/abc/book/extra",
    "/loginx",
    "/offers/new",
    "/offers/abc",
    "/installer",
    "/unsubscribed",
    "/club",
    "/club/abc/extra",
    "/leaderboardx",
    "/leaderboard/abc",
  ])("%s needs a session", (path) => {
    expect(isPublicRoute(path)).toBe(false);
  });
});

// Sections behind lib/features.ts. Off: the proxy lets everyone through to
// the page's own 404, so a guest and a signed-in player see the same thing.
// On: exactly the gate each route had before the flags existed.
describe("isPublicRoute for sections behind a feature flag", () => {
  const defaults = { ...features };
  afterEach(() => {
    Object.assign(features, defaults);
  });

  it.each(["/leaderboard", "/coaches", "/clubs/abc/chat"])(
    "%s is not sent to /login while switched off",
    (path) => {
      Object.assign(features, {
        leaderboard: false,
        coaches: false,
        clubChat: false,
      });
      expect(isPublicRoute(path)).toBe(true);
    },
  );

  it.each([
    ["/leaderboard", true],
    ["/coaches", false],
    ["/clubs/abc/chat", false],
  ])("%s keeps its old gate once switched on (public: %s)", (path, open) => {
    Object.assign(features, {
      leaderboard: true,
      coaches: true,
      clubChat: true,
    });
    expect(isPublicRoute(path)).toBe(open);
  });
});

describe("safeNextPath", () => {
  it.each([
    ["/profile", "/profile"],
    ["/offers?level=3.5#list", "/offers?level=3.5#list"],
    ["/players/abc", "/players/abc"],
  ])("keeps the relative path %s", (next, expected) => {
    expect(safeNextPath(next)).toBe(expected);
  });

  it.each([
    null,
    undefined,
    "",
    "profile",
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "/\t/evil.example",
    "javascript:alert(1)",
    " /profile",
  ])("rejects %j and falls back to /", (next) => {
    expect(safeNextPath(next)).toBe("/");
  });
});
