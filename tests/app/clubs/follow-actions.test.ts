import { beforeEach, describe, expect, it, vi } from "vitest";

import { followClub, unfollowClub } from "@/app/clubs/[id]/follow-actions";

// Session and database are replaced: what's under test is who may follow,
// which write happens, and that following/unfollowing twice is a no-op —
// the same shape as tests/lib/offers/dismissals/actions.test.ts.
const ME = "11111111-1111-4111-8111-111111111111";
const CLUB = "44444444-4444-4444-8444-444444444444";

const {
  requireOnboardedUser,
  clubFindUnique,
  followCreateMany,
  followDeleteMany,
  captureEvent,
  revalidatePath,
} = vi.hoisted(() => ({
  requireOnboardedUser: vi.fn(),
  clubFindUnique: vi.fn(),
  followCreateMany: vi.fn(),
  followDeleteMany: vi.fn(),
  captureEvent: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth/require-onboarded-user", () => ({ requireOnboardedUser }));
vi.mock("@/lib/db", () => ({
  db: {
    club: { findUnique: clubFindUnique },
    clubFollow: {
      createMany: followCreateMany,
      deleteMany: followDeleteMany,
    },
  },
}));
vi.mock("@/lib/analytics/posthog", () => ({ captureEvent }));
vi.mock("next/cache", () => ({ revalidatePath }));

beforeEach(() => {
  vi.clearAllMocks();
  requireOnboardedUser.mockResolvedValue({ id: ME, blockedAt: null });
  clubFindUnique.mockResolvedValue({ id: CLUB });
});

describe("followClub", () => {
  it("rejects a malformed club id", async () => {
    const result = await followClub("not-a-uuid");

    expect(result).toEqual({ ok: false, message: "This club doesn't exist." });
    expect(followCreateMany).not.toHaveBeenCalled();
  });

  it("refuses a club that doesn't exist", async () => {
    clubFindUnique.mockResolvedValue(null);

    const result = await followClub(CLUB);

    expect(result).toEqual({ ok: false, message: "This club doesn't exist." });
    expect(followCreateMany).not.toHaveBeenCalled();
  });

  it("refuses a blocked player without writing", async () => {
    requireOnboardedUser.mockResolvedValue({
      id: ME,
      blockedAt: new Date("2026-10-15T09:00:00Z"),
    });

    const result = await followClub(CLUB);

    expect(result).toEqual({
      ok: false,
      message:
        "Your account is blocked pending a review. You can't create offers, join requests or messages until an admin makes a decision.",
    });
    expect(followCreateMany).not.toHaveBeenCalled();
  });

  it("follows the club for the signed-in player", async () => {
    const result = await followClub(CLUB);

    expect(result).toEqual({ ok: true });
    expect(followCreateMany).toHaveBeenCalledWith({
      data: [{ userId: ME, clubId: CLUB }],
      skipDuplicates: true,
    });
    expect(captureEvent).toHaveBeenCalledWith("club_followed", ME, {});
    expect(revalidatePath).toHaveBeenCalledWith(`/clubs/${CLUB}`);
  });

  it("following twice is a no-op, not an error", async () => {
    const first = await followClub(CLUB);
    const second = await followClub(CLUB);

    expect(first).toEqual({ ok: true });
    expect(second).toEqual({ ok: true });
    expect(followCreateMany).toHaveBeenCalledTimes(2);
  });
});

describe("unfollowClub", () => {
  it("rejects a malformed club id", async () => {
    const result = await unfollowClub("not-a-uuid");

    expect(result).toEqual({ ok: false, message: "This club doesn't exist." });
    expect(followDeleteMany).not.toHaveBeenCalled();
  });

  it("unfollows the club for the signed-in player", async () => {
    const result = await unfollowClub(CLUB);

    expect(result).toEqual({ ok: true });
    expect(followDeleteMany).toHaveBeenCalledWith({
      where: { userId: ME, clubId: CLUB },
    });
    expect(captureEvent).toHaveBeenCalledWith("club_unfollowed", ME, {});
    expect(revalidatePath).toHaveBeenCalledWith(`/clubs/${CLUB}`);
  });

  it("unfollowing a club never followed is a no-op", async () => {
    followDeleteMany.mockResolvedValue({ count: 0 });

    const result = await unfollowClub(CLUB);

    expect(result).toEqual({ ok: true });
  });

  it("a blocked player may still unfollow", async () => {
    requireOnboardedUser.mockResolvedValue({
      id: ME,
      blockedAt: new Date("2026-10-15T09:00:00Z"),
    });

    const result = await unfollowClub(CLUB);

    expect(result).toEqual({ ok: true });
    expect(followDeleteMany).toHaveBeenCalled();
  });
});
