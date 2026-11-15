import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  continueIfSignedIn,
  sendMagicLink,
  verifyLoginCode,
} from "@/app/login/actions";

const {
  headersGet,
  signInWithOtp,
  verifyOtp,
  checkRateLimit,
  ensureUserRow,
  getCurrentUser,
  redirect,
} = vi.hoisted(() => ({
  headersGet: vi.fn(),
  signInWithOtp: vi.fn(),
  verifyOtp: vi.fn(),
  checkRateLimit: vi.fn(),
  ensureUserRow: vi.fn(),
  getCurrentUser: vi.fn(),
  // Like the real one, it never returns: it throws to end the action.
  redirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT ${path}`);
  }),
}));

vi.mock("next/headers", () => ({
  headers: () => Promise.resolve({ get: headersGet }),
}));
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: () =>
    Promise.resolve({ auth: { signInWithOtp, verifyOtp } }),
}));
vi.mock("@/lib/rate-limit/check-rate-limit", () => ({ checkRateLimit }));
vi.mock("@/lib/auth/ensure-user-row", () => ({ ensureUserRow }));
vi.mock("@/lib/auth/require-user", () => ({ getCurrentUser }));

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

describe("verifyLoginCode", () => {
  const input = {
    email: "Player@example.com",
    code: "123 456",
    next: "/offers",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    checkRateLimit.mockResolvedValue({ ok: true });
    verifyOtp.mockResolvedValue({
      data: { user: { id: "user-1", email: "player@example.com" } },
      error: null,
    });
  });

  it("signs in with the code, creates the users row and goes on to next", async () => {
    await expect(verifyLoginCode(input)).rejects.toThrow("REDIRECT /offers");

    expect(verifyOtp).toHaveBeenCalledWith({
      email: "Player@example.com",
      token: "123456",
      type: "email",
    });
    expect(ensureUserRow).toHaveBeenCalledWith("user-1", "player@example.com");
  });

  it("never redirects off the site", async () => {
    await expect(
      verifyLoginCode({ ...input, next: "https://evil.example" }),
    ).rejects.toThrow("REDIRECT /");
  });

  it("counts attempts per email, apart from the emails themselves", async () => {
    await expect(verifyLoginCode(input)).rejects.toThrow();

    expect(checkRateLimit).toHaveBeenCalledWith(
      "code:player@example.com",
      "MAGIC_LINK",
    );
  });

  it("stops guessing once the limit is hit, without asking Supabase", async () => {
    checkRateLimit.mockResolvedValue({ ok: false });

    await expect(verifyLoginCode(input)).resolves.toEqual({
      ok: false,
      message: "Too many attempts. Wait a bit, then ask for a new email.",
    });
    expect(verifyOtp).not.toHaveBeenCalled();
  });

  it("refuses a wrong or expired code without a session or a row", async () => {
    verifyOtp.mockResolvedValue({
      data: { user: null },
      error: { status: 403 },
    });

    await expect(verifyLoginCode(input)).resolves.toEqual({
      ok: false,
      message:
        "That code is wrong or has expired. Check it, or ask for a new email.",
    });
    expect(ensureUserRow).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("rejects a code that isn't digits before any limit or Supabase call", async () => {
    await expect(
      verifyLoginCode({ ...input, code: "12ab56" }),
    ).resolves.toEqual({
      ok: false,
      message: "The code is digits only — check the email.",
    });
    expect(checkRateLimit).not.toHaveBeenCalled();
    expect(verifyOtp).not.toHaveBeenCalled();
  });
});

describe("continueIfSignedIn", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("moves a signed-in player on to next", async () => {
    getCurrentUser.mockResolvedValue({ id: "user-1" });

    await expect(continueIfSignedIn("/profile")).rejects.toThrow(
      "REDIRECT /profile",
    );
  });

  it("does nothing while nobody is signed in", async () => {
    getCurrentUser.mockResolvedValue(null);

    await expect(continueIfSignedIn("/profile")).resolves.toBeUndefined();
    expect(redirect).not.toHaveBeenCalled();
  });
});
