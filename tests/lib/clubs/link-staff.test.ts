import { beforeEach, describe, expect, it, vi } from "vitest";

import { linkClubStaff } from "@/lib/clubs/link-staff";

const { userFindUnique, clubFindUnique, clubStaffUpsert } = vi.hoisted(() => ({
  userFindUnique: vi.fn(),
  clubFindUnique: vi.fn(),
  clubStaffUpsert: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    user: { findUnique: userFindUnique },
    club: { findUnique: clubFindUnique },
    clubStaff: { upsert: clubStaffUpsert },
  },
}));

const USER_ID = "11111111-1111-4111-8111-111111111111";
const CLUB_ID = "22222222-2222-4222-8222-222222222222";

describe("linkClubStaff", () => {
  beforeEach(() => {
    userFindUnique.mockReset();
    clubFindUnique.mockReset();
    clubStaffUpsert.mockReset();
  });

  it("refuses an email with no existing user — they must sign in first", async () => {
    userFindUnique.mockResolvedValue(null);

    const result = await linkClubStaff("nobody@example.com", "olsza", "STAFF");

    expect(result).toEqual({
      ok: false,
      message:
        'No user with email "nobody@example.com" — they need to sign in at least once first.',
    });
    expect(clubFindUnique).not.toHaveBeenCalled();
  });

  it("refuses an unknown club slug", async () => {
    userFindUnique.mockResolvedValue({ id: USER_ID });
    clubFindUnique.mockResolvedValue(null);

    const result = await linkClubStaff(
      "a@example.com",
      "no-such-club",
      "OWNER",
    );

    expect(result).toEqual({
      ok: false,
      message: 'No club with slug "no-such-club".',
    });
    expect(clubStaffUpsert).not.toHaveBeenCalled();
  });

  it("upserts the club_staff row by (clubId, userId)", async () => {
    userFindUnique.mockResolvedValue({ id: USER_ID });
    clubFindUnique.mockResolvedValue({ id: CLUB_ID });

    const result = await linkClubStaff("a@example.com", "olsza", "OWNER");

    expect(result).toEqual({ ok: true });
    expect(clubStaffUpsert).toHaveBeenCalledWith({
      where: { clubId_userId: { clubId: CLUB_ID, userId: USER_ID } },
      create: { clubId: CLUB_ID, userId: USER_ID, role: "OWNER" },
      update: { role: "OWNER" },
    });
  });

  it("is safe to run again, updating the role on a repeat run", async () => {
    userFindUnique.mockResolvedValue({ id: USER_ID });
    clubFindUnique.mockResolvedValue({ id: CLUB_ID });

    await linkClubStaff("a@example.com", "olsza", "STAFF");

    expect(clubStaffUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ update: { role: "STAFF" } }),
    );
  });
});
