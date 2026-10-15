import { describe, expect, it } from "vitest";

import { blockedRefusal } from "@/lib/moderation/block-rules";
import { testTranslator } from "@/tests/helpers/translator";

const t = testTranslator("Errors");

describe("blockedRefusal", () => {
  it("refuses a blocked player", () => {
    expect(blockedRefusal(t, { blockedAt: new Date() })).toBe(t("blocked"));
  });

  it("allows a player who isn't blocked", () => {
    expect(blockedRefusal(t, { blockedAt: null })).toBeNull();
  });
});
