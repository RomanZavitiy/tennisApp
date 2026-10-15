import { describe, expect, it } from "vitest";

import { BLOCKED_MESSAGE, blockedRefusal } from "@/lib/moderation/block-rules";

describe("blockedRefusal", () => {
  it("refuses a blocked player", () => {
    expect(blockedRefusal({ blockedAt: new Date() })).toBe(BLOCKED_MESSAGE);
  });

  it("allows a player who isn't blocked", () => {
    expect(blockedRefusal({ blockedAt: null })).toBeNull();
  });
});
