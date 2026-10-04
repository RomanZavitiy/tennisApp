import { beforeEach, describe, expect, it, vi } from "vitest";

import { requireOnboardedUser } from "@/lib/auth/require-onboarded-user";

// Session and database are replaced. redirect() is made to throw, as the real
// one does, so the code after it never runs.
const { findUnique, redirect } = vi.hoisted(() => ({
  findUnique: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
}));

vi.mock("@/lib/auth/require-user", () => ({
  requireUser: () => Promise.resolve({ id: "user-1", email: undefined }),
}));
vi.mock("@/lib/db", () => ({ db: { user: { findUnique } } }));
vi.mock("next/navigation", () => ({ redirect }));

const complete = {
  id: "user-1",
  name: "Ola",
  birthDate: new Date("1995-04-12T00:00:00Z"),
  gender: "FEMALE",
  district: "KROWODRZA",
  selfRatedNtrp: 3.5,
  onboardingCompletedAt: new Date("2026-10-04T10:00:00Z"),
  avatarPath: "user-1/photo.webp",
};

describe("requireOnboardedUser", () => {
  beforeEach(() => {
    findUnique.mockReset();
  });

  it("returns the profile of an onboarded player", async () => {
    findUnique.mockResolvedValue(complete);

    await expect(requireOnboardedUser()).resolves.toEqual({
      id: "user-1",
      name: "Ola",
      birthDate: complete.birthDate,
      gender: "FEMALE",
      district: "KROWODRZA",
      selfRatedNtrp: 3.5,
      avatarPath: "user-1/photo.webp",
    });
  });

  it("sends a player who hasn't onboarded to /onboarding", async () => {
    findUnique.mockResolvedValue({
      id: "user-1",
      name: null,
      birthDate: null,
      gender: null,
      district: null,
      selfRatedNtrp: null,
      onboardingCompletedAt: null,
    });

    await expect(requireOnboardedUser()).rejects.toThrow(
      "redirect:/onboarding",
    );
  });

  it("sends a player without a users row to /onboarding", async () => {
    findUnique.mockResolvedValue(null);

    await expect(requireOnboardedUser()).rejects.toThrow(
      "redirect:/onboarding",
    );
  });
});
