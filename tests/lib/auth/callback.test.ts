import { describe, expect, it } from "vitest";

import { parseCallbackParams } from "@/lib/auth/callback";

function parse(query: string) {
  return parseCallbackParams(new URLSearchParams(query));
}

describe("parseCallbackParams", () => {
  it("reads an OAuth code", () => {
    expect(parse("code=abc&next=/profile")).toEqual({
      kind: "code",
      code: "abc",
      next: "/profile",
    });
  });

  it.each(["email", "magiclink", "signup"])(
    "reads a magic link token of type %s",
    (type) => {
      expect(parse(`token_hash=xyz&type=${type}`)).toEqual({
        kind: "otp",
        tokenHash: "xyz",
        type,
        next: "/",
      });
    },
  );

  it.each([
    "",
    "token_hash=xyz",
    "token_hash=xyz&type=recovery",
    "type=email",
    "error=access_denied&error_description=Email+link+is+invalid",
    "error=access_denied&code=abc",
  ])("treats %j as an invalid link", (query) => {
    expect(parse(query).kind).toBe("invalid");
  });

  it("never returns an off-site next path", () => {
    expect(parse("code=abc&next=https://evil.example").next).toBe("/");
    expect(parse("error=x&next=//evil.example").next).toBe("/");
  });
});
