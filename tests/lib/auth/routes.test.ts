import { describe, expect, it } from "vitest";

import { isPublicRoute, safeNextPath } from "@/lib/auth/routes";

describe("isPublicRoute", () => {
  it.each([
    "/",
    "/login",
    "/auth/callback",
    "/clubs",
    "/clubs/abc",
    "/offers",
    "/players/abc",
  ])("%s is public", (path) => {
    expect(isPublicRoute(path)).toBe(true);
  });

  it.each([
    "/profile",
    "/profile/edit",
    "/onboarding",
    "/players",
    "/clubs/a/b",
    "/loginx",
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
