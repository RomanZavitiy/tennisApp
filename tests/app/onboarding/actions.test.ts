import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { completeOnboarding } from "@/app/onboarding/actions";
import { AuthRequiredError } from "@/lib/auth/require-user";
import { CURRENT_CONSENT_VERSION } from "@/lib/legal/consent";

// The server must reject what the browser would have caught, because a
// request can skip the form. Session, database and redirect are replaced.
const { requireUser, update, redirect, captureEvent } = vi.hoisted(() => ({
  requireUser: vi.fn(),
  update: vi.fn(),
  redirect: vi.fn(),
  captureEvent: vi.fn(),
}));

vi.mock("@/lib/auth/require-user", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  requireUser,
}));
vi.mock("@/lib/db", () => ({ db: { user: { updateMany: update } } }));
vi.mock("@/lib/analytics/posthog", () => ({ captureEvent }));
vi.mock("next/navigation", () => ({ redirect }));

const valid = {
  name: "Ola",
  birthDate: "1995-04-12",
  gender: "FEMALE",
  district: "KROWODRZA",
  selfRatedNtrp: 3.5,
  agreeToTerms: true,
};

describe("completeOnboarding", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-04T10:00:00Z"));
    requireUser.mockResolvedValue({ id: "user-1", email: "ola@example.com" });
    update.mockReset();
    update.mockResolvedValue({ count: 1 });
    redirect.mockReset();
    captureEvent.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("saves a valid profile with its starting ELO, marks onboarding done and goes home", async () => {
    await completeOnboarding({ ...valid, name: "  Ola " });

    expect(update).toHaveBeenCalledWith({
      // Only a first onboarding writes: a repeat can't reset the rating.
      where: { id: "user-1", onboardingCompletedAt: null },
      data: {
        name: "Ola",
        birthDate: new Date("1995-04-12T00:00:00Z"),
        gender: "FEMALE",
        district: "KROWODRZA",
        selfRatedNtrp: 3.5,
        elo: 1400,
        onboardingCompletedAt: new Date("2026-10-04T10:00:00Z"),
        consentedAt: new Date("2026-10-04T10:00:00Z"),
        consentVersion: CURRENT_CONSENT_VERSION,
      },
    });
    expect(redirect).toHaveBeenCalledWith("/");
    expect(captureEvent).toHaveBeenCalledWith("signup_completed", "user-1", {});
  });

  it("rejects a submission that didn't agree to the terms, without saving", async () => {
    const result = await completeOnboarding({
      ...valid,
      agreeToTerms: false,
    });

    expect(result.fieldErrors).toEqual({
      agreeToTerms: "You must agree to continue.",
    });
    expect(update).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("doesn't fire signup_completed on a repeat call (count 0, already onboarded)", async () => {
    update.mockResolvedValue({ count: 0 });

    await completeOnboarding(valid);

    expect(captureEvent).not.toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith("/");
  });

  it("rejects input that skipped the form's checks, without saving", async () => {
    const result = await completeOnboarding({
      ...valid,
      name: "",
      birthDate: "2015-01-01",
      selfRatedNtrp: 3.3,
      district: "KAZIMIERZ",
    });

    expect(result.fieldErrors).toEqual({
      name: "Enter your name.",
      birthDate: "You must be at least 18 to join.",
      selfRatedNtrp: "Choose your level.",
      district: "Choose your district.",
    });
    expect(update).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("rejects a request that isn't an object", async () => {
    await expect(completeOnboarding("nonsense")).resolves.toEqual({
      ok: false,
      fieldErrors: {},
    });
    expect(update).not.toHaveBeenCalled();
  });

  it("refuses without a session", async () => {
    requireUser.mockRejectedValue(new AuthRequiredError());

    await expect(completeOnboarding(valid)).rejects.toThrow(AuthRequiredError);
    expect(update).not.toHaveBeenCalled();
  });
});
