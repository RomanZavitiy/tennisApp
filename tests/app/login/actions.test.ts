import { beforeEach, describe, expect, it, vi } from "vitest";

import { sendMagicLink } from "@/app/login/actions";

const { headersGet, signInWithOtp, checkRateLimit } = vi.hoisted(() => ({
  headersGet: vi.fn(),
  signInWithOtp: vi.fn(),
  checkRateLimit: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: () => Promise.resolve({ get: headersGet }),
}));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: () =>
    Promise.resolve({ auth: { signInWithOtp } }),
}));
vi.mock("@/lib/rate-limit/check-rate-limit", () => ({ checkRateLimit }));

const valid = { email: "player@example.com", next: "/offers" };

describe("sendMagicLink", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    headersGet.mockReturnValue("https://spinbuddy.vercel.app");
    signInWithOtp.mockResolvedValue({ error: null });
    checkRateLimit.mockResolvedValue({ ok: true });
  });

  it("sends the link once under the limit", async () => {
    await expect(sendMagicLink(valid)).resolves.toEqual({ ok: true });
    expect(checkRateLimit).toHaveBeenCalledWith(
      "player@example.com",
      "MAGIC_LINK",
    );
    expect(signInWithOtp).toHaveBeenCalled();
  });

  it("refuses once the hourly limit is hit, without calling Supabase", async () => {
    checkRateLimit.mockResolvedValue({ ok: false });

    await expect(sendMagicLink(valid)).resolves.toEqual({
      ok: false,
      message: "Too many sign-in emails. Wait a bit and try again.",
    });
    expect(signInWithOtp).not.toHaveBeenCalled();
  });

  it("still handles Supabase's own 429, if that's hit instead", async () => {
    signInWithOtp.mockResolvedValue({ error: { status: 429 } });

    await expect(sendMagicLink(valid)).resolves.toEqual({
      ok: false,
      message: "Too many sign-in emails. Wait a minute and try again.",
    });
  });

  it("rejects an invalid email without checking the limit", async () => {
    await expect(
      sendMagicLink({ email: "not-an-email", next: "/" }),
    ).resolves.toEqual({
      ok: false,
      message: "Enter a valid email address.",
    });
    expect(checkRateLimit).not.toHaveBeenCalled();
  });
});
