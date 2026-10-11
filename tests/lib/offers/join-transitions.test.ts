import { describe, expect, it } from "vitest";

import {
  ACTION_ACTOR,
  joinChangeRefusal,
  nextJoinStatus,
  offerStatusFor,
  type JoinAction,
} from "@/lib/offers/join-transitions";

const NOW = new Date("2026-10-11T10:00:00Z");
const LATER = new Date("2026-10-20T16:00:00Z");
const STATUSES = ["REQUESTED", "ACCEPTED", "DECLINED", "WITHDRAWN"] as const;

const singles = {
  status: "OPEN",
  format: "SINGLES",
  hasPartner: false,
  startsAt: LATER,
} as const;
const doubles = { ...singles, format: "DOUBLES" } as const;
const doublesWithPartner = { ...doubles, hasPartner: true } as const;

describe("nextJoinStatus", () => {
  // Every action against every status: anything not listed is refused.
  const allowed: Record<JoinAction, Record<string, string>> = {
    ACCEPT: { REQUESTED: "ACCEPTED" },
    DECLINE: { REQUESTED: "DECLINED" },
    WITHDRAW: { REQUESTED: "WITHDRAWN", ACCEPTED: "WITHDRAWN" },
  };

  for (const action of ["ACCEPT", "DECLINE", "WITHDRAW"] as const) {
    it.each(STATUSES)(`${action} from %s`, (status) => {
      expect(nextJoinStatus(action, status)).toBe(
        allowed[action][status] ?? null,
      );
    });
  }

  it("leaves accepting and declining to the author, withdrawing to the player", () => {
    expect(ACTION_ACTOR).toEqual({
      ACCEPT: "AUTHOR",
      DECLINE: "AUTHOR",
      WITHDRAW: "PLAYER",
    });
  });
});

describe("joinChangeRefusal", () => {
  function refusal(
    action: JoinAction,
    {
      joinStatus = "REQUESTED",
      offer = singles,
      acceptedCount = 0,
    }: {
      joinStatus?: (typeof STATUSES)[number];
      offer?: Parameters<typeof offerStatusFor>[0];
      acceptedCount?: number;
    } = {},
  ) {
    return joinChangeRefusal({
      action,
      joinStatus,
      offer,
      acceptedCount,
      now: NOW,
    });
  }

  it("allows the listed transitions on an open upcoming offer", () => {
    expect(refusal("ACCEPT")).toBeNull();
    expect(refusal("DECLINE")).toBeNull();
    expect(refusal("WITHDRAW", { joinStatus: "ACCEPTED" })).toBeNull();
  });

  it("refuses a transition the table doesn't have", () => {
    expect(refusal("ACCEPT", { joinStatus: "DECLINED" })).toBe("NOT_ALLOWED");
    expect(refusal("DECLINE", { joinStatus: "ACCEPTED" })).toBe("NOT_ALLOWED");
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

  it("refuses accepting or withdrawing on a cancelled or started offer", () => {
    const cancelled = { ...singles, status: "CANCELLED" } as const;
    const started = { ...singles, startsAt: NOW };
    expect(refusal("ACCEPT", { offer: cancelled })).toBe("CANCELLED");
    expect(refusal("WITHDRAW", { offer: cancelled })).toBe("CANCELLED");
    expect(refusal("ACCEPT", { offer: started })).toBe("STARTED");
    expect(
      refusal("WITHDRAW", { offer: started, joinStatus: "ACCEPTED" }),
    ).toBe("STARTED");
  });

  it("always lets the author decline an open request", () => {
    expect(
      refusal("DECLINE", {
        offer: { ...singles, status: "FULL" },
        acceptedCount: 1,
      }),
    ).toBeNull();
    expect(
      refusal("DECLINE", { offer: { ...singles, startsAt: NOW } }),
    ).toBeNull();
  });
});

describe("offerStatusFor", () => {
  it.each([
    ["singles", singles, 1],
    ["doubles", doubles, 3],
    ["doubles with a partner", doublesWithPartner, 2],
  ] as const)("fills %s at %i accepted players", (_, offer, needed) => {
    expect(offerStatusFor(offer, needed - 1)).toBe("OPEN");
    expect(offerStatusFor(offer, needed)).toBe("FULL");
  });

  it("reopens a full offer when a place frees up", () => {
    expect(offerStatusFor({ ...doubles, status: "FULL" }, 2)).toBe("OPEN");
  });

  it("keeps a cancelled offer cancelled", () => {
    expect(offerStatusFor({ ...singles, status: "CANCELLED" }, 1)).toBe(
      "CANCELLED",
    );
  });
});
