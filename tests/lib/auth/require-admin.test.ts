import { beforeEach, describe, expect, it, vi } from "vitest";

import { requireAdmin } from "@/lib/auth/require-admin";

// Session and database are replaced. notFound() is made to throw, as the
// real one does, so the code after it never runs — same convention as
// require-onboarded-user.test.ts's redirect() mock.
const { getCurrentUser, findUnique, notFound } = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  findUnique: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error("not-found");
  }),
}));

vi.mock("@/lib/auth/require-user", () => ({ getCurrentUser }));
vi.mock("@/lib/db", () => ({ db: { user: { findUnique } } }));
vi.mock("next/navigation", () => ({ notFound }));

describe("requireAdmin", () => {
  beforeEach(() => {
    getCurrentUser.mockReset();
    findUnique.mockReset();
    notFound.mockClear();
  });

  it("returns the session user when isAdmin is true", async () => {
    getCurrentUser.mockResolvedValue({ id: "admin-1", email: "a@example.com" });
    findUnique.mockResolvedValue({ isAdmin: true });

    await expect(requireAdmin()).resolves.toEqual({
      id: "admin-1",
      email: "a@example.com",
    });
    expect(notFound).not.toHaveBeenCalled();
  });

  it("404s a signed-in player without isAdmin", async () => {
    getCurrentUser.mockResolvedValue({ id: "user-1", email: undefined });
    findUnique.mockResolvedValue({ isAdmin: false });

    await expect(requireAdmin()).rejects.toThrow("not-found");
  });

  it("404s a signed-out visitor, the same as a non-admin", async () => {
    getCurrentUser.mockResolvedValue(null);

    await expect(requireAdmin()).rejects.toThrow("not-found");
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("404s a user whose row doesn't exist", async () => {
    getCurrentUser.mockResolvedValue({ id: "ghost", email: undefined });
    findUnique.mockResolvedValue(null);

    await expect(requireAdmin()).rejects.toThrow("not-found");
  });
});
