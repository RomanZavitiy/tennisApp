import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { giveConsent } from "@/app/consent/actions";
import { CURRENT_CONSENT_VERSION } from "@/lib/legal/consent";

const ME = "11111111-1111-4111-8111-111111111111";

const { update, redirect } = vi.hoisted(() => ({
  update: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
}));

vi.mock("@/lib/auth/require-user", () => ({
  requireUser: () => Promise.resolve({ id: ME, email: undefined }),
}));
vi.mock("@/lib/db", () => ({ db: { user: { update } } }));
vi.mock("next/navigation", () => ({ redirect }));

describe("giveConsent", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-16T10:00:00Z"));
    update.mockReset().mockResolvedValue(undefined);
    redirect.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("records consentedAt and the current version, then goes home", async () => {
    await expect(giveConsent()).rejects.toThrow("redirect:/");

    expect(update).toHaveBeenCalledWith({
      where: { id: ME },
      data: {
        consentedAt: new Date("2026-10-16T10:00:00Z"),
        consentVersion: CURRENT_CONSENT_VERSION,
      },
    });
  });
});
