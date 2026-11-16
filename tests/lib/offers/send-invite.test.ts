import { beforeEach, describe, expect, it, vi } from "vitest";

import { sendOfferInvite } from "@/lib/offers/send-invite";

// The database is replaced: what's under test is that an invite into a
// men's or women's game (slice PD3) is refused for a player it isn't for,
// before anything is written.
const {
  offerFindUnique,
  inviteFindUnique,
  inviteCreate,
  joinFindUnique,
  userFindUnique,
  notify,
} = vi.hoisted(() => ({
  offerFindUnique: vi.fn(),
  inviteFindUnique: vi.fn(),
  inviteCreate: vi.fn(),
  joinFindUnique: vi.fn(),
  userFindUnique: vi.fn(),
  notify: vi.fn(),
}));
vi.mock("@/lib/db", () => ({
  db: {
    sparringOffer: { findUnique: offerFindUnique },
    offerInvite: { findUnique: inviteFindUnique, create: inviteCreate },
    offerJoin: { findUnique: joinFindUnique },
    user: { findUnique: userFindUnique },
  },
}));
vi.mock("@/lib/moderation/personal-block", () => ({
  isBlockedEitherWay: vi.fn().mockResolvedValue(false),
}));
vi.mock("@/lib/notifications/notify", () => ({ notify }));

const NOW = new Date("2026-11-17T10:00:00Z");

describe("sendOfferInvite and the match type", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    offerFindUnique.mockResolvedValue({
      authorId: "author",
      status: "OPEN",
      startsAt: new Date("2026-11-18T10:00:00Z"),
      matchGender: "WOMEN",
    });
    inviteFindUnique.mockResolvedValue(null);
    joinFindUnique.mockResolvedValue(null);
    inviteCreate.mockResolvedValue({ id: "invite-1" });
  });

  it("refuses to invite a man into a women's game", async () => {
    userFindUnique.mockResolvedValue({ gender: "MALE" });

    expect(await sendOfferInvite("offer", "author", "player", NOW)).toEqual({
      ok: false,
      refusal: "WRONG_GENDER",
    });
    expect(inviteCreate).not.toHaveBeenCalled();
    expect(notify).not.toHaveBeenCalled();
  });

  it("invites a woman into a women's game", async () => {
    userFindUnique.mockResolvedValue({ gender: "FEMALE" });

    expect(await sendOfferInvite("offer", "author", "player", NOW)).toEqual({
      ok: true,
    });
    expect(inviteCreate).toHaveBeenCalledTimes(1);
  });
});
