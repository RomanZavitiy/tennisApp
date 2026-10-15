import { describe, expect, it } from "vitest";

import {
  interestedCandidates,
  isInterestedIn,
  isQuietHours,
  warsawDateString,
  type NewOfferInfo,
  type OfferPushCandidate,
} from "@/lib/matching/offer-interest";

const AUTHOR = "author-id";
const OFFER: NewOfferInfo = {
  authorId: AUTHOR,
  district: "STARE_MIASTO",
  ntrpMin: 3.5,
  ntrpMax: 4.0,
};

function candidate(over: Partial<OfferPushCandidate> = {}): OfferPushCandidate {
  return {
    userId: "player-id",
    district: "STARE_MIASTO",
    selfRatedNtrp: 3.5,
    notifyNewOffers: true,
    offerPushSentOn: null,
    offerPushSentCount: 0,
    ...over,
  };
}

// Midday Warsaw time (UTC+2 in October... no, October is still +2 until the
// last Sunday — pick a date comfortably in winter time, UTC+1, so the
// correspondence with UTC is simple and unambiguous for the whole suite).
const NOON_WARSAW = new Date("2026-11-10T11:00:00Z"); // 12:00 Europe/Warsaw

describe("isQuietHours", () => {
  it("is not quiet at noon", () => {
    expect(isQuietHours(NOON_WARSAW)).toBe(false);
  });

  it("is not quiet right at 07:00", () => {
    expect(isQuietHours(new Date("2026-11-10T06:00:00Z"))).toBe(false);
  });

  it("is quiet one minute before 07:00", () => {
    expect(isQuietHours(new Date("2026-11-10T05:59:00Z"))).toBe(true);
  });

  it("is quiet right at 22:00", () => {
    expect(isQuietHours(new Date("2026-11-10T21:00:00Z"))).toBe(true);
  });

  it("is not quiet one minute before 22:00", () => {
    expect(isQuietHours(new Date("2026-11-10T20:59:00Z"))).toBe(false);
  });

  it("is quiet in the middle of the night", () => {
    expect(isQuietHours(new Date("2026-11-10T02:00:00Z"))).toBe(true);
  });
});

describe("warsawDateString", () => {
  it("formats as YYYY-MM-DD in Europe/Warsaw", () => {
    expect(warsawDateString(NOON_WARSAW)).toBe("2026-11-10");
  });

  it("rolls over at the Warsaw midnight, not UTC midnight", () => {
    // 23:30 Warsaw (winter, UTC+1) is 22:30 UTC, already the next UTC day
    // relative to the previous example — check the reverse edge instead:
    // 00:30 Warsaw is 23:30 UTC the day before.
    expect(warsawDateString(new Date("2026-11-09T23:30:00Z"))).toBe(
      "2026-11-10",
    );
  });
});

describe("isInterestedIn", () => {
  it("matches same district and level", () => {
    expect(isInterestedIn(candidate(), OFFER, NOON_WARSAW)).toBe(true);
  });

  it("never notifies the offer's own author", () => {
    expect(
      isInterestedIn(candidate({ userId: AUTHOR }), OFFER, NOON_WARSAW),
    ).toBe(false);
  });

  it("skips a different district", () => {
    expect(
      isInterestedIn(candidate({ district: "PODGORZE" }), OFFER, NOON_WARSAW),
    ).toBe(false);
  });

  it("skips an offer with no district at all", () => {
    expect(
      isInterestedIn(candidate(), { ...OFFER, district: null }, NOON_WARSAW),
    ).toBe(false);
  });

  it("skips a player who opted out of new-offer pushes", () => {
    expect(
      isInterestedIn(candidate({ notifyNewOffers: false }), OFFER, NOON_WARSAW),
    ).toBe(false);
  });

  it("skips a level more than half a step below the wanted range", () => {
    expect(
      isInterestedIn(candidate({ selfRatedNtrp: 2.5 }), OFFER, NOON_WARSAW),
    ).toBe(false);
  });

  it("matches exactly half a step below the wanted minimum", () => {
    expect(
      isInterestedIn(candidate({ selfRatedNtrp: 3.0 }), OFFER, NOON_WARSAW),
    ).toBe(true);
  });

  it("matches exactly half a step above the wanted maximum", () => {
    expect(
      isInterestedIn(candidate({ selfRatedNtrp: 4.5 }), OFFER, NOON_WARSAW),
    ).toBe(true);
  });

  it("skips a level more than half a step above the wanted range", () => {
    expect(
      isInterestedIn(candidate({ selfRatedNtrp: 5.0 }), OFFER, NOON_WARSAW),
    ).toBe(false);
  });

  it("matches any level when the offer sets no range", () => {
    expect(
      isInterestedIn(
        candidate({ selfRatedNtrp: 1.5 }),
        { ...OFFER, ntrpMin: null, ntrpMax: null },
        NOON_WARSAW,
      ),
    ).toBe(true);
  });

  it("skips a player with no self-rated level yet", () => {
    expect(
      isInterestedIn(candidate({ selfRatedNtrp: null }), OFFER, NOON_WARSAW),
    ).toBe(false);
  });

  it("skips during quiet hours", () => {
    expect(
      isInterestedIn(candidate(), OFFER, new Date("2026-11-10T02:00:00Z")),
    ).toBe(false);
  });

  it("skips once today's cap is reached", () => {
    expect(
      isInterestedIn(
        candidate({ offerPushSentOn: "2026-11-10", offerPushSentCount: 3 }),
        OFFER,
        NOON_WARSAW,
      ),
    ).toBe(false);
  });

  it("still sends the 3rd push of the day", () => {
    expect(
      isInterestedIn(
        candidate({ offerPushSentOn: "2026-11-10", offerPushSentCount: 2 }),
        OFFER,
        NOON_WARSAW,
      ),
    ).toBe(true);
  });

  it("resets the cap on a new Warsaw day", () => {
    expect(
      isInterestedIn(
        candidate({ offerPushSentOn: "2026-11-09", offerPushSentCount: 3 }),
        OFFER,
        NOON_WARSAW,
      ),
    ).toBe(true);
  });
});

describe("interestedCandidates", () => {
  it("filters a list down to the matching candidates, in order", () => {
    const matching = candidate({ userId: "a" });
    const wrongDistrict = candidate({ userId: "b", district: "PODGORZE" });
    const theAuthor = candidate({ userId: AUTHOR });

    expect(
      interestedCandidates(
        [wrongDistrict, matching, theAuthor],
        OFFER,
        NOON_WARSAW,
      ),
    ).toEqual([matching]);
  });
});
