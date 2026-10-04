import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { completeOnboarding } from "@/app/onboarding/actions";
import { AuthRequiredError } from "@/lib/auth/require-user";

// The server must reject what the browser would have caught, because a
// request can skip the form. Session, database and redirect are replaced.
const { requireUser, update, redirect } = vi.hoisted(() => ({
  requireUser: vi.fn(),
  update: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("@/lib/auth/require-user", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  requireUser,
}));
vi.mock("@/lib/db", () => ({ db: { user: { update } } }));
vi.mock("next/navigation", () => ({ redirect }));

const valid = {
  name: "Ola",
  birthDate: "1995-04-12",
  gender: "FEMALE",
  district: "KROWODRZA",
  selfRatedNtrp: 3.5,
};

describe("completeOnboarding", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-04T10:00:00Z"));
    requireUser.mockResolvedValue({ id: "user-1", email: "ola@example.com" });
    update.mockReset();
    redirect.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("saves a valid profile, marks onboarding done and goes home", async () => {
    await completeOnboarding({ ...valid, name: "  Ola " });

    expect(update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: {
        name: "Ola",
        birthDate: new Date("1995-04-12T00:00:00Z"),
        gender: "FEMALE",
        district: "KROWODRZA",
        selfRatedNtrp: 3.5,
        onboardingCompletedAt: new Date("2026-10-04T10:00:00Z"),
      },
    });
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
      birthDate: "You must be at least 16 to join.",
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
