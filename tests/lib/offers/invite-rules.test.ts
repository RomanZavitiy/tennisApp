import { describe, expect, it } from "vitest";

import { inviteRefusal } from "@/lib/offers/invite-rules";

const NOW = new Date("2026-10-11T10:00:00Z");
const AUTHOR = "author";
const INVITEE = "invitee";

function refusal({
  status = "OPEN",
  startsAt = new Date("2026-10-20T16:00:00Z"),
  inviterId = AUTHOR,
  inviteeId = INVITEE,
  existingInvite = null,
  existingJoin = null,
  blocked = false,
}: {
  status?: "OPEN" | "FULL" | "CANCELLED";
  startsAt?: Date;
  inviterId?: string;
  inviteeId?: string;
  existingInvite?: {
    status: "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED";
  } | null;
  existingJoin?: {
    status: "REQUESTED" | "ACCEPTED" | "DECLINED" | "WITHDRAWN";
  } | null;
  blocked?: boolean;
} = {}) {
  return inviteRefusal({
    offer: { authorId: AUTHOR, status, startsAt },
    inviterId,
    inviteeId,
    existingInvite,
    existingJoin,
    now: NOW,
    blocked,
  });
}

describe("inviteRefusal", () => {
  it("lets the author invite a player into an open upcoming offer", () => {
    expect(refusal()).toBeNull();
  });

  it("refuses an invite from anyone but the author", () => {
    expect(refusal({ inviterId: "someone-else" })).toBe("NOT_AUTHOR");
  });

  it("refuses inviting yourself", () => {
    expect(refusal({ inviteeId: AUTHOR })).toBe("SELF");
  });

  it("refuses an invite between two players who have blocked each other", () => {
    expect(refusal({ blocked: true })).toBe("BLOCKED");
  });

  it("blocked takes priority over an offer that has already started", () => {
    expect(refusal({ blocked: true, startsAt: NOW })).toBe("BLOCKED");
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
    "refuses inviting a player who already has a %s join request",
    (status) => {
      expect(refusal({ existingJoin: { status } })).toBe("ALREADY_JOINED");
    },
  );

  it.each(["PENDING", "ACCEPTED"] as const)(
    "refuses a second invite while the first is %s",
    (status) => {
      expect(refusal({ existingInvite: { status } })).toBe("ALREADY_INVITED");
    },
  );

  it("refuses re-inviting a player who declined", () => {
    expect(refusal({ existingInvite: { status: "DECLINED" } })).toBe(
      "DECLINED",
    );
  });

  it("lets the author re-invite a player whose earlier invite expired", () => {
    expect(refusal({ existingInvite: { status: "EXPIRED" } })).toBeNull();
  });
});
