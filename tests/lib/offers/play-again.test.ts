import { describe, expect, it } from "vitest";

import {
  krakowLocalPlusDays,
  playAgainParams,
  type PlayAgainOffer,
} from "@/lib/offers/play-again";

describe("krakowLocalPlusDays", () => {
  it("keeps the same wall-clock time across the autumn DST switch", () => {
    // 2026-10-25 is the Sunday clocks go back in Poland (krakow-time.test.ts).
    // Adding 7 UTC days to the instant would land on 17:00, not 18:00 — this
    // adds to the local calendar date instead, so the time never moves.
    expect(krakowLocalPlusDays("2026-10-20T18:00", 7)).toBe("2026-10-27T18:00");
  });

  it("keeps the same wall-clock time across the spring DST switch", () => {
    // 2026-03-29 is the Sunday clocks go forward.
    expect(krakowLocalPlusDays("2026-03-24T09:00", 7)).toBe("2026-03-31T09:00");
  });

  it("rolls over month and year boundaries", () => {
    expect(krakowLocalPlusDays("2026-12-28T20:00", 7)).toBe("2027-01-04T20:00");
  });
});

describe("playAgainParams", () => {
  const base: PlayAgainOffer = {
    startsAt: new Date("2026-10-20T16:00:00Z"), // 18:00 Kraków
    durationMinutes: 90,
    format: "SINGLES",
    clubId: "club-1",
    district: "PODGORZE",
    ntrpMin: 3.5,
    ntrpMax: 4,
    opponentId: "opponent-1",
  };

  it("carries the offer's facts and the date one week on", () => {
    const params = playAgainParams(base);
    expect(params.get("format")).toBe("SINGLES");
    expect(params.get("durationMinutes")).toBe("90");
    expect(params.get("startsAt")).toBe("2026-10-27T18:00");
    expect(params.get("clubId")).toBe("club-1");
    expect(params.get("district")).toBe("PODGORZE");
    expect(params.get("ntrpMin")).toBe("3.5");
    expect(params.get("ntrpMax")).toBe("4");
  });

  it("carries the opponent to invite (task Q.2)", () => {
    const params = playAgainParams(base);
    expect(params.get("invite")).toBe("opponent-1");
  });

  it("omits fields the original offer didn't have", () => {
    const params = playAgainParams({
      ...base,
      clubId: null,
      district: null,
      ntrpMin: null,
      ntrpMax: null,
    });
    expect(params.has("clubId")).toBe(false);
    expect(params.has("district")).toBe(false);
    expect(params.has("ntrpMin")).toBe(false);
    expect(params.has("ntrpMax")).toBe(false);
  });
});
