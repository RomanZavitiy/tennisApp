import { beforeEach, describe, expect, it, vi } from "vitest";

import { inviteFavorites } from "@/app/offers/[id]/favorite-actions";

// Session and database are replaced: what's under test is that "Invite my
// favourites" (slice PD3, task PD3.4) sends the ordinary invite to each
// favourite, under the ordinary rate limit, and reports how many went out.
const OFFER = "11111111-1111-4111-8111-111111111111";

const {
  requireOnboardedUser,
  getFavoritePlayers,
  sendOfferInvite,
  checkRateLimit,
  captureEvent,
} = vi.hoisted(() => ({
  requireOnboardedUser: vi.fn(),
  getFavoritePlayers: vi.fn(),
  sendOfferInvite: vi.fn(),
  checkRateLimit: vi.fn(),
  captureEvent: vi.fn(),
}));
vi.mock("@/lib/auth/require-onboarded-user", () => ({ requireOnboardedUser }));
vi.mock("@/lib/players/favorites", () => ({ getFavoritePlayers }));
vi.mock("@/lib/offers/send-invite", () => ({ sendOfferInvite }));
vi.mock("@/lib/rate-limit/check-rate-limit", () => ({ checkRateLimit }));
vi.mock("@/lib/analytics/posthog", () => ({ captureEvent }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const favorite = (id: string) => ({ id, name: id, avatarPath: null });

describe("inviteFavorites", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireOnboardedUser.mockResolvedValue({ id: "me", blockedAt: null });
    checkRateLimit.mockResolvedValue({ ok: true });
    getFavoritePlayers.mockResolvedValue([favorite("a"), favorite("b")]);
    sendOfferInvite.mockResolvedValue({ ok: true });
  });

  it("invites every favourite as the signed-in author", async () => {
    expect(await inviteFavorites(OFFER)).toEqual({ ok: true, invited: 2 });
    expect(sendOfferInvite).toHaveBeenCalledWith(OFFER, "me", "a");
    expect(sendOfferInvite).toHaveBeenCalledWith(OFFER, "me", "b");
    expect(captureEvent).toHaveBeenCalledWith("invite_sent", "me", {
      source: "favorites",
    });
  });

  it("skips a favourite who can't be invited and counts the rest", async () => {
    sendOfferInvite
      .mockResolvedValueOnce({ ok: false, refusal: "ALREADY_INVITED" })
      .mockResolvedValueOnce({ ok: true });

    expect(await inviteFavorites(OFFER)).toEqual({ ok: true, invited: 1 });
  });

  it("stops at once on someone else's offer", async () => {
    sendOfferInvite.mockResolvedValue({ ok: false, refusal: "NOT_AUTHOR" });

    expect(await inviteFavorites(OFFER)).toMatchObject({ ok: false });
    expect(sendOfferInvite).toHaveBeenCalledTimes(1);
  });

  it("stops sending when the invite limit runs out", async () => {
    checkRateLimit
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: false });

    expect(await inviteFavorites(OFFER)).toEqual({ ok: true, invited: 1 });
    expect(sendOfferInvite).toHaveBeenCalledTimes(1);
  });

  it("says so when the limit was already used up, or the id is bad", async () => {
    checkRateLimit.mockResolvedValue({ ok: false });
    expect(await inviteFavorites(OFFER)).toMatchObject({ ok: false });
    expect(await inviteFavorites("nope")).toMatchObject({ ok: false });
    expect(sendOfferInvite).not.toHaveBeenCalled();
  });

  it("refuses an admin-blocked account", async () => {
    requireOnboardedUser.mockResolvedValue({
      id: "me",
      blockedAt: new Date("2026-11-01T00:00:00Z"),
    });
    expect(await inviteFavorites(OFFER)).toMatchObject({ ok: false });
    expect(getFavoritePlayers).not.toHaveBeenCalled();
  });
});
