import { describe, expect, it } from "vitest";

import { loginSchema, magicLinkRequestSchema } from "@/lib/validation/login";

function emailError(email: string) {
  const result = loginSchema.safeParse({ email });
  return result.success ? null : result.error.issues[0]?.message;
}

describe("loginSchema", () => {
  it("accepts a valid email and trims spaces", () => {
    expect(loginSchema.parse({ email: "  player@example.com " })).toEqual({
      email: "player@example.com",
    });
  });

  it.each(["", "   "])("asks for an email when it is %j", (email) => {
    expect(emailError(email)).toBe("Enter your email address.");
  });

  it.each(["player", "player@", "@example.com", "player@example"])(
    "rejects the malformed email %j",
    (email) => {
      expect(emailError(email)).toBe("Enter a valid email address.");
    },
  );
});

describe("magicLinkRequestSchema", () => {
  it("rejects a missing next path", () => {
    expect(
      magicLinkRequestSchema.safeParse({ email: "player@example.com" }).success,
    ).toBe(false);
  });

  it("rejects an overlong next path", () => {
    const next = `/${"a".repeat(2048)}`;
    expect(
      magicLinkRequestSchema.safeParse({ email: "player@example.com", next })
        .success,
    ).toBe(false);
  });
});
