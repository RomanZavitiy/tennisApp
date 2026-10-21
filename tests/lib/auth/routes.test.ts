import { describe, expect, it } from "vitest";

import { isPublicRoute, safeNextPath } from "@/lib/auth/routes";

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
    "/install",
    "/unsubscribe",
    "/admin",
    "/admin/reports",
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
  ])("%s needs a session", (path) => {
    expect(isPublicRoute(path)).toBe(false);
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
