import { describe, expect, it } from "vitest";

import {
  inviteChangeRefusal,
  nextInviteStatus,
  type InviteAction,
} from "@/lib/offers/invite-transitions";

const NOW = new Date("2026-10-11T10:00:00Z");
const LATER = new Date("2026-10-20T16:00:00Z");
const STATUSES = ["PENDING", "ACCEPTED", "DECLINED", "EXPIRED"] as const;

const singles = {
  status: "OPEN",
  format: "SINGLES",
  hasPartner: false,
  startsAt: LATER,
} as const;
const doubles = { ...singles, format: "DOUBLES" } as const;
const doublesWithPartner = { ...doubles, hasPartner: true } as const;

describe("nextInviteStatus", () => {
  const allowed: Record<InviteAction, Record<string, string>> = {
    ACCEPT: { PENDING: "ACCEPTED" },
    DECLINE: { PENDING: "DECLINED" },
  };

  for (const action of ["ACCEPT", "DECLINE"] as const) {
    it.each(STATUSES)(`${action} from %s`, (status) => {
      expect(nextInviteStatus(action, status)).toBe(
        allowed[action][status] ?? null,
      );
    });
  }
});

describe("inviteChangeRefusal", () => {
  function refusal(
    action: InviteAction,
    {
      inviteStatus = "PENDING",
      offer = singles,
      acceptedCount = 0,
      blocked = false,
    }: {
      inviteStatus?: (typeof STATUSES)[number];
      offer?: Parameters<typeof inviteChangeRefusal>[0]["offer"];
      acceptedCount?: number;
      blocked?: boolean;
    } = {},
  ) {
    return inviteChangeRefusal({
      action,
      inviteStatus,
      offer,
      acceptedCount,
      now: NOW,
      blocked,
    });
  }

  it("allows accepting or declining a pending invite on an open upcoming offer", () => {
    expect(refusal("ACCEPT")).toBeNull();
    expect(refusal("DECLINE")).toBeNull();
  });

  it("refuses a transition the table doesn't have", () => {
    expect(refusal("ACCEPT", { inviteStatus: "DECLINED" })).toBe("NOT_ALLOWED");
    expect(refusal("DECLINE", { inviteStatus: "ACCEPTED" })).toBe(
      "NOT_ALLOWED",
    );
  });

  it.each([
    ["singles", singles, 1],
    ["doubles", doubles, 3],
    ["doubles with a partner", doublesWithPartner, 2],
  ] as const)(
    "accepts %s players until every place is taken",
    (_, offer, needed) => {
      expect(
        refusal("ACCEPT", { offer, acceptedCount: needed - 1 }),
      ).toBeNull();
      expect(
        refusal("ACCEPT", {
          offer: { ...offer, status: "FULL" },
          acceptedCount: needed,
        }),
      ).toBe("FULL");
    },
  );

  it("refuses accepting a cancelled or started offer", () => {
    expect(
      refusal("ACCEPT", { offer: { ...singles, status: "CANCELLED" } }),
    ).toBe("NOT_OPEN");
    expect(refusal("ACCEPT", { offer: { ...singles, startsAt: NOW } })).toBe(
      "STARTED",
    );
  });

  it("refuses accepting between two players who have blocked each other since the invite", () => {
    expect(refusal("ACCEPT", { blocked: true })).toBe("BLOCKED");
  });

  it("always lets the invitee decline a pending invite", () => {
    expect(
      refusal("DECLINE", { offer: { ...singles, status: "FULL" } }),
    ).toBeNull();
    expect(
      refusal("DECLINE", { offer: { ...singles, startsAt: NOW } }),
    ).toBeNull();
    expect(refusal("DECLINE", { blocked: true })).toBeNull();
  });
});
