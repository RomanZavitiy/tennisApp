import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  createUnsubscribeToken,
  verifyUnsubscribeToken,
} from "@/lib/notifications/unsubscribe-token";

describe("unsubscribe tokens", () => {
  const originalSecret = process.env.UNSUBSCRIBE_SECRET;

  beforeEach(() => {
    process.env.UNSUBSCRIBE_SECRET = "test-secret";
  });

  afterEach(() => {
    process.env.UNSUBSCRIBE_SECRET = originalSecret;
  });

  it("round-trips the user id", () => {
    const token = createUnsubscribeToken("user-1");

    expect(verifyUnsubscribeToken(token)).toBe("user-1");
  });

  it("refuses a forged token (test from the task's checklist)", () => {
    const token = createUnsubscribeToken("user-1");
    const forged = token.slice(0, -1) + (token.endsWith("A") ? "B" : "A");

    expect(verifyUnsubscribeToken(forged)).toBeNull();
  });

  it("refuses a token signed with a different secret", () => {
    const token = createUnsubscribeToken("user-1");
    process.env.UNSUBSCRIBE_SECRET = "a-different-secret";

    expect(verifyUnsubscribeToken(token)).toBeNull();
  });

  it("refuses a malformed token with no signature", () => {
    expect(verifyUnsubscribeToken("not-a-real-token")).toBeNull();
  });

  it("refuses an empty token", () => {
    expect(verifyUnsubscribeToken("")).toBeNull();
  });

  it("refuses a signature copied onto someone else's id", () => {
    const token = createUnsubscribeToken("user-1");
    const otherPayload = Buffer.from("user-2", "utf8").toString("base64url");
    const [, signature] = token.split(".");

    expect(verifyUnsubscribeToken(`${otherPayload}.${signature}`)).toBeNull();
  });
});
