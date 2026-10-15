import { describe, expect, it } from "vitest";

import {
  partyOf,
  settleResultRefusal,
  submitResultRefusal,
} from "@/lib/offers/result-rules";

const AUTHOR_ID = "author-id";
const PLAYER_ID = "player-id";
const STRANGER_ID = "stranger-id";
const join = { userId: PLAYER_ID, offer: { authorId: AUTHOR_ID } };

const NOW = new Date("2026-10-15T10:00:00Z");
const PAST = new Date("2026-10-14T10:00:00Z");
const FUTURE = new Date("2026-10-16T10:00:00Z");

describe("partyOf", () => {
  it("is AUTHOR for the offer's author", () => {
    expect(partyOf(join, AUTHOR_ID)).toBe("AUTHOR");
  });

  it("is PLAYER for the join's player", () => {
    expect(partyOf(join, PLAYER_ID)).toBe("PLAYER");
  });

  it("is null for anyone else", () => {
    expect(partyOf(join, STRANGER_ID)).toBeNull();
  });
});

describe("submitResultRefusal", () => {
  const base = {
    party: "AUTHOR" as const,
    joinStatus: "ACCEPTED" as const,
    offerFormat: "SINGLES" as const,
    startsAt: PAST,
    hasExistingResult: false,
    now: NOW,
  };

  it("allows a participant of an accepted singles join, after the start", () => {
    expect(submitResultRefusal(base)).toBeNull();
  });

  it("refuses someone who isn't a party to the join", () => {
    expect(submitResultRefusal({ ...base, party: null })).toBe(
      "NOT_PARTICIPANT",
    );
  });

  it("refuses a doubles offer", () => {
    expect(submitResultRefusal({ ...base, offerFormat: "DOUBLES" })).toBe(
      "NOT_SINGLES",
    );
  });

  it.each(["REQUESTED", "DECLINED", "WITHDRAWN"] as const)(
    "refuses a join that was never accepted (%s)",
    (joinStatus) => {
      expect(submitResultRefusal({ ...base, joinStatus })).toBe("NOT_ACCEPTED");
    },
  );

  it("refuses a match that hasn't started yet", () => {
    expect(submitResultRefusal({ ...base, startsAt: FUTURE })).toBe(
      "NOT_STARTED",
    );
  });

  it("refuses a second submission for the same match", () => {
    expect(submitResultRefusal({ ...base, hasExistingResult: true })).toBe(
      "ALREADY_SUBMITTED",
    );
  });
});

describe("settleResultRefusal", () => {
  const base = {
    party: "PLAYER" as const,
    reportedBy: "AUTHOR" as const,
    status: "PENDING" as const,
  };

  it("allows the other party while the result is pending", () => {
    expect(settleResultRefusal(base)).toBeNull();
  });

  it("refuses the party who filed the result", () => {
    expect(settleResultRefusal({ ...base, party: "AUTHOR" })).toBe(
      "NOT_OPPONENT",
    );
  });

  it("refuses someone who isn't a party at all", () => {
    expect(settleResultRefusal({ ...base, party: null })).toBe("NOT_OPPONENT");
  });

  it.each(["CONFIRMED", "DISPUTED", "NO_SHOW"] as const)(
    "refuses a result that's already settled (%s)",
    (status) => {
      expect(settleResultRefusal({ ...base, status })).toBe("NOT_PENDING");
    },
  );
});
