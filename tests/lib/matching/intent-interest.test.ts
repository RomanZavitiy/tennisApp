import { describe, expect, it } from "vitest";

import {
  offerMatchesIntent,
  offersMatchingIntent,
  type OpenOfferForIntent,
  type PlayIntentInfo,
} from "@/lib/matching/intent-interest";

const INTENT_OWNER = "intent-owner";
const AUTHOR = "author-id";

// 18:00 Europe/Warsaw (winter, UTC+1) on 2026-11-10, same calendar day the
// intent below is for.
const MATCHING_OFFER: OpenOfferForIntent = {
  offerId: "offer-1",
  authorId: AUTHOR,
  district: "STARE_MIASTO",
  ntrpMin: 3.5,
  ntrpMax: 4.0,
  format: "SINGLES",
  startsAt: new Date("2026-11-10T17:00:00Z"),
  notifyNewOffers: true,
  offerPushSentOn: null,
  offerPushSentCount: 0,
};

const INTENT: PlayIntentInfo = {
  userId: INTENT_OWNER,
  date: "2026-11-10",
  times: ["evening"],
  districts: ["STARE_MIASTO"],
  format: "SINGLES",
  selfRatedNtrp: 3.5,
};

// Noon Europe/Warsaw — well outside quiet hours.
const NOW = new Date("2026-11-10T11:00:00Z");

describe("offerMatchesIntent", () => {
  it("matches a same-district, same-level, same-day, same-format offer", () => {
    expect(offerMatchesIntent(MATCHING_OFFER, INTENT, NOW)).toBe(true);
  });

  it("never matches the intent owner's own offer", () => {
    expect(
      offerMatchesIntent(
        { ...MATCHING_OFFER, authorId: INTENT_OWNER },
        INTENT,
        NOW,
      ),
    ).toBe(false);
  });

  it("skips a district the intent didn't ask for", () => {
    expect(
      offerMatchesIntent(
        { ...MATCHING_OFFER, district: "PODGORZE" },
        INTENT,
        NOW,
      ),
    ).toBe(false);
  });

  it("skips a different format", () => {
    expect(
      offerMatchesIntent({ ...MATCHING_OFFER, format: "DOUBLES" }, INTENT, NOW),
    ).toBe(false);
  });

  it("skips a level outside the offer's range", () => {
    expect(
      offerMatchesIntent(
        MATCHING_OFFER,
        { ...INTENT, selfRatedNtrp: 1.5 },
        NOW,
      ),
    ).toBe(false);
  });

  it("skips a different calendar day", () => {
    expect(
      offerMatchesIntent(
        { ...MATCHING_OFFER, startsAt: new Date("2026-11-11T17:00:00Z") },
        INTENT,
        NOW,
      ),
    ).toBe(false);
  });

  it("skips a time of day the intent didn't ask for", () => {
    expect(
      offerMatchesIntent(
        MATCHING_OFFER,
        { ...INTENT, times: ["morning"] },
        NOW,
      ),
    ).toBe(false);
  });

  it("respects the author's own push throttle (opted out)", () => {
    expect(
      offerMatchesIntent(
        { ...MATCHING_OFFER, notifyNewOffers: false },
        INTENT,
        NOW,
      ),
    ).toBe(false);
  });

  it("respects the author's own daily cap", () => {
    expect(
      offerMatchesIntent(
        {
          ...MATCHING_OFFER,
          offerPushSentOn: "2026-11-10",
          offerPushSentCount: 3,
        },
        INTENT,
        NOW,
      ),
    ).toBe(false);
  });
});

describe("offersMatchingIntent", () => {
  it("filters a list down to the matching offers, in order", () => {
    const matching = { ...MATCHING_OFFER, offerId: "a" };
    const wrongDistrict = {
      ...MATCHING_OFFER,
      offerId: "b",
      district: "PODGORZE" as const,
    };

    expect(
      offersMatchingIntent([wrongDistrict, matching], INTENT, NOW),
    ).toEqual([matching]);
  });
});
