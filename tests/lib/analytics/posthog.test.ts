import { describe, expect, it } from "vitest";

import { sanitize } from "@/lib/analytics/posthog";

describe("sanitize", () => {
  it("drops every banned key regardless of case", () => {
    const cleaned = sanitize({
      email: "player@example.com",
      Name: "Alex",
      content: "hey, free tonight?",
      format: "SINGLES",
      hasClub: true,
    });

    expect(cleaned).toEqual({ format: "SINGLES", hasClub: true });
  });

  it("passes through an already-clean payload unchanged", () => {
    const cleaned = sanitize({ target: "URL" });

    expect(cleaned).toEqual({ target: "URL" });
  });

  it("returns an empty object for an empty payload", () => {
    expect(sanitize({})).toEqual({});
  });
});
