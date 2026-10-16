import { beforeEach, describe, expect, it, vi } from "vitest";

import { deleteMyAccount } from "@/app/(member)/profile/delete/actions";

const ME = "11111111-1111-4111-8111-111111111111";

const {
  requireOnboardedUser,
  redactAccountData,
  deleteAccountStorageAndAuth,
  signOut,
  redirect,
} = vi.hoisted(() => ({
  requireOnboardedUser: vi.fn(),
  redactAccountData: vi.fn(),
  deleteAccountStorageAndAuth: vi.fn(),
  signOut: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
}));

vi.mock("@/lib/auth/require-onboarded-user", () => ({ requireOnboardedUser }));
vi.mock("@/lib/privacy/delete-account", () => ({
  redactAccountData,
  deleteAccountStorageAndAuth,
}));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: () => Promise.resolve({ auth: { signOut } }),
}));
vi.mock("next/navigation", () => ({ redirect }));

describe("deleteMyAccount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireOnboardedUser.mockResolvedValue({ id: ME });
    redactAccountData.mockResolvedValue(undefined);
    deleteAccountStorageAndAuth.mockResolvedValue(undefined);
    signOut.mockResolvedValue(undefined);
  });

  it("redacts data, cleans up storage/auth, signs out locally, then redirects", async () => {
    await expect(deleteMyAccount()).rejects.toThrow(
      "redirect:/account-deleted",
    );

    expect(redactAccountData).toHaveBeenCalledWith(ME);
    expect(deleteAccountStorageAndAuth).toHaveBeenCalledWith(ME);
    expect(signOut).toHaveBeenCalledWith({ scope: "local" });

    const order = [
      redactAccountData.mock.invocationCallOrder[0],
      deleteAccountStorageAndAuth.mock.invocationCallOrder[0],
      signOut.mock.invocationCallOrder[0],
      redirect.mock.invocationCallOrder[0],
    ];
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it("never reaches storage/auth cleanup or sign-out if redaction fails", async () => {
    redactAccountData.mockRejectedValue(new Error("db down"));

    await expect(deleteMyAccount()).rejects.toThrow("db down");

    expect(deleteAccountStorageAndAuth).not.toHaveBeenCalled();
    expect(signOut).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });
});
