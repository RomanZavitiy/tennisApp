import { describe, expect, it } from "vitest";

import {
  intentInviteParams,
  intentMatchesFilters,
  playIntentExpiresAt,
  type IntentSummary,
} from "@/lib/offers/play-intent";

describe("playIntentExpiresAt", () => {
  it("is midnight Europe/Warsaw after the given date (winter, UTC+1)", () => {
    expect(playIntentExpiresAt("2026-11-10")).toEqual(
      new Date("2026-11-10T23:00:00Z"),
    );
  });

  it("is midnight Europe/Warsaw after the given date (summer, UTC+2)", () => {
    expect(playIntentExpiresAt("2026-07-10")).toEqual(
      new Date("2026-07-10T22:00:00Z"),
    );
  });

  it("is null for a malformed date", () => {
    expect(playIntentExpiresAt("not-a-date")).toBeNull();
  });
});

describe("intentMatchesFilters", () => {
  const INTENT: IntentSummary = {
    date: "2026-11-10",
    times: ["evening"],
    districts: ["STARE_MIASTO"],
    format: "SINGLES",
    selfRatedNtrp: 3.5,
  };

  it("matches with no filters at all", () => {
    expect(intentMatchesFilters(INTENT, {})).toBe(true);
  });

  it("matches on date", () => {
    expect(intentMatchesFilters(INTENT, { date: "2026-11-10" })).toBe(true);
    expect(intentMatchesFilters(INTENT, { date: "2026-11-11" })).toBe(false);
  });

  it("matches a district the intent wants", () => {
    expect(intentMatchesFilters(INTENT, { district: "STARE_MIASTO" })).toBe(
      true,
    );
    expect(intentMatchesFilters(INTENT, { district: "PODGORZE" })).toBe(false);
  });

  it("matches on format", () => {
    expect(intentMatchesFilters(INTENT, { format: "SINGLES" })).toBe(true);
    expect(intentMatchesFilters(INTENT, { format: "DOUBLES" })).toBe(false);
  });

  it("matches a wanted time of day", () => {
    expect(intentMatchesFilters(INTENT, { time: "evening" })).toBe(true);
    expect(intentMatchesFilters(INTENT, { time: "morning" })).toBe(false);
  });

  it("matches the intent owner's level within half an NTRP step", () => {
    expect(intentMatchesFilters(INTENT, { ntrp: 3.5 })).toBe(true);
    expect(intentMatchesFilters(INTENT, { ntrp: 4.0 })).toBe(true);
    expect(intentMatchesFilters(INTENT, { ntrp: 5.0 })).toBe(false);
  });
});

describe("intentInviteParams", () => {
  it("prefills format, startsAt, district and invite", () => {
    const params = intentInviteParams({
      userId: "player-1",
      date: "2026-11-10",
      times: ["evening"],
      districts: ["STARE_MIASTO"],
      format: "SINGLES",
    });

    expect(params.get("format")).toBe("SINGLES");
    expect(params.get("invite")).toBe("player-1");
    expect(params.get("startsAt")).toBe("2026-11-10T18:00");
    expect(params.get("district")).toBe("STARE_MIASTO");
  });

  it("leaves district out when the intent names none", () => {
    const params = intentInviteParams({
      userId: "player-1",
      date: "2026-11-10",
      times: ["morning"],
      districts: [],
      format: "DOUBLES",
    });

    expect(params.has("district")).toBe(false);
    expect(params.get("startsAt")).toBe("2026-11-10T09:00");
  });
});
