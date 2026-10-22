import { beforeEach, describe, expect, it, vi } from "vitest";

import { requireClubStaff } from "@/lib/auth/require-club-staff";

const CLUB = "11111111-1111-4111-8111-111111111111";

// Session and database are replaced. notFound() is made to throw, as the
// real one does, so the code after it never runs — same convention as
// require-admin.test.ts.
const { getCurrentUser, findUnique, notFound } = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  findUnique: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error("not-found");
  }),
}));

vi.mock("@/lib/auth/require-user", () => ({ getCurrentUser }));
vi.mock("@/lib/db", () => ({ db: { clubStaff: { findUnique } } }));
vi.mock("next/navigation", () => ({ notFound }));

describe("requireClubStaff", () => {
  beforeEach(() => {
    getCurrentUser.mockReset();
    findUnique.mockReset();
    notFound.mockClear();
  });

  it("returns the session user plus role when a club_staff row exists", async () => {
    getCurrentUser.mockResolvedValue({ id: "staff-1", email: "s@example.com" });
    findUnique.mockResolvedValue({ role: "OWNER" });

    await expect(requireClubStaff(CLUB)).resolves.toEqual({
      id: "staff-1",
      email: "s@example.com",
      clubId: CLUB,
      role: "OWNER",
    });
    expect(findUnique).toHaveBeenCalledWith({
      where: { clubId_userId: { clubId: CLUB, userId: "staff-1" } },
      select: { role: true },
    });
    expect(notFound).not.toHaveBeenCalled();
  });

  it("404s a signed-in player who isn't staff of this club", async () => {
    getCurrentUser.mockResolvedValue({ id: "player-1", email: undefined });
    findUnique.mockResolvedValue(null);

    await expect(requireClubStaff(CLUB)).rejects.toThrow("not-found");
  });

  it("404s a signed-out visitor, the same as a non-staff player", async () => {
    getCurrentUser.mockResolvedValue(null);

    await expect(requireClubStaff(CLUB)).rejects.toThrow("not-found");
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("404s staff of a different club", async () => {
    getCurrentUser.mockResolvedValue({ id: "staff-2", email: undefined });
    findUnique.mockResolvedValue(null);

    await expect(requireClubStaff(CLUB)).rejects.toThrow("not-found");
    expect(findUnique).toHaveBeenCalledWith({
      where: { clubId_userId: { clubId: CLUB, userId: "staff-2" } },
      select: { role: true },
    });
  });
});
