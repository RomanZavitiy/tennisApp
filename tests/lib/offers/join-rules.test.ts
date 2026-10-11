import { describe, expect, it } from "vitest";

import { joinRefusal } from "@/lib/offers/join-rules";

const NOW = new Date("2026-10-11T10:00:00Z");
const AUTHOR = "author";
const PLAYER = "player";

function refusal({
  status = "OPEN",
  startsAt = new Date("2026-10-20T16:00:00Z"),
  authorId = AUTHOR,
  existing = null,
}: {
  status?: "OPEN" | "FULL" | "CANCELLED";
  startsAt?: Date;
  authorId?: string;
  existing?: {
    status: "REQUESTED" | "ACCEPTED" | "DECLINED" | "WITHDRAWN";
  } | null;
} = {}) {
  return joinRefusal({
    offer: { authorId, status, startsAt },
    playerId: PLAYER,
    existing,
    now: NOW,
  });
}

describe("joinRefusal", () => {
  it("lets a player ask to join an open upcoming offer", () => {
    expect(refusal()).toBeNull();
  });

  it("refuses the author's own offer", () => {
    expect(refusal({ authorId: PLAYER })).toBe("OWN_OFFER");
  });

  it("refuses an offer that has started or is in the past", () => {
    expect(refusal({ startsAt: NOW })).toBe("STARTED");
    expect(refusal({ startsAt: new Date("2026-10-01T16:00:00Z") })).toBe(
      "STARTED",
    );
  });

  it.each(["FULL", "CANCELLED"] as const)("refuses a %s offer", (status) => {
    expect(refusal({ status })).toBe("NOT_OPEN");
  });

  it.each(["REQUESTED", "ACCEPTED"] as const)(
    "refuses a second request while the first is %s",
    (status) => {
      expect(refusal({ existing: { status } })).toBe("ALREADY_REQUESTED");
    },
  );

  it("refuses a player the author has declined", () => {
    expect(refusal({ existing: { status: "DECLINED" } })).toBe("DECLINED");
  });

  it("lets a player who withdrew ask again", () => {
    expect(refusal({ existing: { status: "WITHDRAWN" } })).toBeNull();
  });
});
