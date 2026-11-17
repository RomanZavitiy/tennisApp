import { describe, expect, it } from "vitest";

import { inviteRefusal } from "@/lib/offers/invite-rules";
import { joinRefusal } from "@/lib/offers/join-rules";
import {
  genderFits,
  matchGendersOpenTo,
  requiredGender,
} from "@/lib/offers/match-gender";
import { waitlistJoinRefusal } from "@/lib/offers/waitlist-rules";

// Slice PD3, task PD3.1: who a game is for.

describe("genderFits", () => {
  it("lets anyone into an unrestricted or a mixed game", () => {
    for (const gender of ["MALE", "FEMALE", null] as const) {
      expect(genderFits("ANY", gender)).toBe(true);
      expect(genderFits("MIXED", gender)).toBe(true);
    }
  });

  it("keeps a men's game to men and a women's game to women", () => {
    expect(genderFits("MEN", "MALE")).toBe(true);
    expect(genderFits("MEN", "FEMALE")).toBe(false);
    expect(genderFits("WOMEN", "FEMALE")).toBe(true);
    expect(genderFits("WOMEN", "MALE")).toBe(false);
  });

  it("keeps a player with no gender on file out of a single-gender game", () => {
    expect(genderFits("MEN", null)).toBe(false);
    expect(genderFits("WOMEN", undefined)).toBe(false);
  });
});

describe("requiredGender", () => {
  it("names the one gender a game is limited to, if any", () => {
    expect(requiredGender("MEN")).toBe("MALE");
    expect(requiredGender("WOMEN")).toBe("FEMALE");
    expect(requiredGender("ANY")).toBeNull();
    expect(requiredGender("MIXED")).toBeNull();
  });
});

describe("matchGendersOpenTo", () => {
  it("lists the kinds of game a player may join", () => {
    expect(matchGendersOpenTo("MALE")).toEqual(["ANY", "MEN", "MIXED"]);
    expect(matchGendersOpenTo("FEMALE")).toEqual(["ANY", "WOMEN", "MIXED"]);
    expect(matchGendersOpenTo(undefined)).toEqual(["ANY", "MIXED"]);
  });
});

describe("the gender check in the join, waitlist and invite rules", () => {
  const NOW = new Date("2026-11-17T10:00:00Z");
  const base = {
    authorId: "author",
    startsAt: new Date("2026-11-18T10:00:00Z"),
  };

  it("refuses a join request from a player the game isn't for", () => {
    const args = {
      offer: { ...base, status: "OPEN" as const },
      playerId: "player",
      existing: null,
      now: NOW,
    };
    expect(joinRefusal({ ...args, fitsGender: false })).toBe("WRONG_GENDER");
    expect(joinRefusal(args)).toBeNull();
  });

  it("says a closed offer is closed before it says anything about gender", () => {
    expect(
      joinRefusal({
        offer: { ...base, status: "CANCELLED" },
        playerId: "player",
        existing: null,
        now: NOW,
        fitsGender: false,
      }),
    ).toBe("NOT_OPEN");
  });

  it("refuses the waitlist of a full game the player couldn't play in", () => {
    const args = {
      offer: { ...base, status: "FULL" as const },
      playerId: "player",
      existingJoin: null,
      alreadyWaitlisted: false,
      now: NOW,
    };
    expect(waitlistJoinRefusal({ ...args, fitsGender: false })).toBe(
      "WRONG_GENDER",
    );
    expect(waitlistJoinRefusal(args)).toBeNull();
  });

  it("refuses an invite to a player the game isn't for", () => {
    const args = {
      offer: { ...base, status: "OPEN" as const },
      inviterId: "author",
      inviteeId: "player",
      existingInvite: null,
      existingJoin: null,
      now: NOW,
    };
    expect(inviteRefusal({ ...args, fitsGender: false })).toBe("WRONG_GENDER");
    expect(inviteRefusal(args)).toBeNull();
  });
});
