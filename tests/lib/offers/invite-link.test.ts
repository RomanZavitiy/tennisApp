import { describe, expect, it } from "vitest";

import {
  inviteLinkRefusal,
  inviteTokenSchema,
  newInviteToken,
  tokensMatch,
} from "@/lib/offers/invite-link";

// Slice PD3, task PD3.3: the invite link's rules.

describe("newInviteToken", () => {
  it("makes a URL-safe token the schema accepts, different every time", () => {
    const a = newInviteToken();
    const b = newInviteToken();
    expect(a).not.toBe(b);
    expect(inviteTokenSchema.safeParse(a).success).toBe(true);
    expect(a).toMatch(/^[A-Za-z0-9_-]{32}$/);
  });
});

describe("inviteTokenSchema", () => {
  it("rejects anything that couldn't be a token", () => {
    expect(inviteTokenSchema.safeParse("short").success).toBe(false);
    expect(inviteTokenSchema.safeParse("a".repeat(65)).success).toBe(false);
    expect(inviteTokenSchema.safeParse(`${"a".repeat(30)}/x`).success).toBe(
      false,
    );
  });
});

describe("tokensMatch", () => {
  it("matches only the current token", () => {
    const token = newInviteToken();
    expect(tokensMatch(token, token)).toBe(true);
    expect(tokensMatch(token, newInviteToken())).toBe(false);
    expect(tokensMatch(token, token.slice(1))).toBe(false);
  });

  it("matches nothing when the link is off", () => {
    expect(tokensMatch(null, newInviteToken())).toBe(false);
  });
});

describe("inviteLinkRefusal", () => {
  const NOW = new Date("2026-11-17T10:00:00Z");
  const base = {
    tokenMatches: true,
    offer: {
      authorId: "author",
      status: "OPEN" as const,
      startsAt: new Date("2026-11-18T10:00:00Z"),
    },
    playerId: "player",
    existingJoin: null,
    spotsLeft: 2,
    now: NOW,
    blocked: false,
    fitsGender: true,
  };

  it("lets a player take a free place in an open game", () => {
    expect(inviteLinkRefusal(base)).toBeNull();
  });

  it("checks the token before anything else", () => {
    expect(
      inviteLinkRefusal({
        ...base,
        tokenMatches: false,
        blocked: true,
        offer: { ...base.offer, status: "CANCELLED" },
      }),
    ).toBe("INVALID_LINK");
  });

  it("refuses the author, a blocked pair and a started game", () => {
    expect(inviteLinkRefusal({ ...base, playerId: "author" })).toBe(
      "OWN_OFFER",
    );
    expect(inviteLinkRefusal({ ...base, blocked: true })).toBe("BLOCKED");
    expect(
      inviteLinkRefusal({
        ...base,
        offer: { ...base.offer, startsAt: NOW },
      }),
    ).toBe("STARTED");
  });

  it("refuses a full game, whether or not its status says so yet", () => {
    expect(
      inviteLinkRefusal({ ...base, offer: { ...base.offer, status: "FULL" } }),
    ).toBe("FULL");
    expect(inviteLinkRefusal({ ...base, spotsLeft: 0 })).toBe("FULL");
  });

  it("refuses a cancelled game", () => {
    expect(
      inviteLinkRefusal({
        ...base,
        offer: { ...base.offer, status: "CANCELLED" },
      }),
    ).toBe("NOT_OPEN");
  });

  it("refuses a player the game isn't for", () => {
    expect(inviteLinkRefusal({ ...base, fitsGender: false })).toBe(
      "WRONG_GENDER",
    );
  });

  it("says a player already in is in, even once the game is full", () => {
    expect(
      inviteLinkRefusal({
        ...base,
        existingJoin: { status: "ACCEPTED" },
        offer: { ...base.offer, status: "FULL" },
      }),
    ).toBe("ALREADY_IN");
  });

  it("keeps the author's earlier 'no', but lets a waiting or withdrawn request in", () => {
    expect(
      inviteLinkRefusal({ ...base, existingJoin: { status: "DECLINED" } }),
    ).toBe("DECLINED");
    expect(
      inviteLinkRefusal({ ...base, existingJoin: { status: "REQUESTED" } }),
    ).toBeNull();
    expect(
      inviteLinkRefusal({ ...base, existingJoin: { status: "WITHDRAWN" } }),
    ).toBeNull();
  });
});
