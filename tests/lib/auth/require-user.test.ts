import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthRequiredError, requireUser } from "@/lib/auth/require-user";

// The Supabase client is replaced: what's under test is how requireUser
// reacts to getClaims(), not Supabase's token verification itself.
const getClaims = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: () => Promise.resolve({ auth: { getClaims } }),
}));

describe("requireUser", () => {
  beforeEach(() => {
    getClaims.mockReset();
  });

  it("returns the user when the session is valid", async () => {
    getClaims.mockResolvedValue({
      data: {
        claims: {
          sub: "00000000-0000-0000-0000-000000000001",
          email: "player@example.com",
        },
      },
      error: null,
    });

    await expect(requireUser()).resolves.toEqual({
      id: "00000000-0000-0000-0000-000000000001",
      email: "player@example.com",
    });
  });

  it("throws when there is no session", async () => {
    getClaims.mockResolvedValue({ data: null, error: null });

    await expect(requireUser()).rejects.toThrow(AuthRequiredError);
  });

  it("throws when the token fails verification", async () => {
    getClaims.mockResolvedValue({
      data: null,
      error: new Error("invalid JWT"),
    });

    await expect(requireUser()).rejects.toThrow(AuthRequiredError);
  });
});
