import { describe, expect, it } from "vitest";

import {
  loginCodeRequestSchema,
  loginCodeSchema,
  loginSchema,
  magicLinkRequestSchema,
} from "@/lib/validation/login";
import { testTranslator } from "@/tests/helpers/translator";

const t = testTranslator("Validation.login");

function emailError(email: string) {
  const result = loginSchema(t).safeParse({ email });
  return result.success ? null : result.error.issues[0]?.message;
}

describe("loginSchema", () => {
  it("accepts a valid email and trims spaces", () => {
    expect(loginSchema(t).parse({ email: "  player@example.com " })).toEqual({
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
      magicLinkRequestSchema(t).safeParse({ email: "player@example.com" })
        .success,
    ).toBe(false);
  });

  it("rejects an overlong next path", () => {
    const next = `/${"a".repeat(2048)}`;
    expect(
      magicLinkRequestSchema(t).safeParse({
        email: "player@example.com",
        next,
      }).success,
    ).toBe(false);
  });
});

describe("loginCodeSchema", () => {
  function codeError(code: string) {
    const result = loginCodeSchema(t).safeParse({ code });
    return result.success ? null : result.error.issues[0]?.message;
  }

  it.each([
    ["123456", "123456"],
    [" 123 456 ", "123456"],
    ["12345678", "12345678"],
  ])("accepts %j as %j", (code, expected) => {
    expect(loginCodeSchema(t).parse({ code })).toEqual({ code: expected });
  });

  it.each(["", "   "])("asks for the code when it is %j", (code) => {
    expect(codeError(code)).toBe("Enter the code from the email.");
  });

  it.each(["12345", "12345678901", "12ab56", "123-456"])(
    "rejects the malformed code %j",
    (code) => {
      expect(codeError(code)).toBe(
        "The code is digits only — check the email.",
      );
    },
  );
});

describe("loginCodeRequestSchema", () => {
  it("needs the email, the code and next together", () => {
    const full = { email: "player@example.com", code: "123456", next: "/" };
    expect(loginCodeRequestSchema(t).safeParse(full).success).toBe(true);
    for (const key of ["email", "code", "next"] as const) {
      const rest = Object.fromEntries(
        Object.entries(full).filter(([name]) => name !== key),
      );
      expect(loginCodeRequestSchema(t).safeParse(rest).success).toBe(false);
    }
  });
});
