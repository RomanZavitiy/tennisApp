import { describe, expect, it } from "vitest";

import {
  isWaitlistOfferStale,
  waitlistJoinRefusal,
  waitlistPosition,
} from "@/lib/offers/waitlist-rules";

const NOW = new Date("2026-10-11T10:00:00Z");
const AUTHOR = "author";
const PLAYER = "player";

function refusal({
  status = "FULL",
  startsAt = new Date("2026-10-20T16:00:00Z"),
  authorId = AUTHOR,
  existingJoin = null,
  alreadyWaitlisted = false,
  blocked = false,
}: {
  status?: "OPEN" | "FULL" | "CANCELLED";
  startsAt?: Date;
  authorId?: string;
  existingJoin?: {
    status: "REQUESTED" | "ACCEPTED" | "DECLINED" | "WITHDRAWN";
  } | null;
  alreadyWaitlisted?: boolean;
  blocked?: boolean;
} = {}) {
  return waitlistJoinRefusal({
    offer: { authorId, status, startsAt },
    playerId: PLAYER,
    existingJoin,
    alreadyWaitlisted,
    now: NOW,
    blocked,
  });
}

describe("waitlistJoinRefusal", () => {
  it("lets a player join the waitlist of a FULL upcoming offer", () => {
    expect(refusal()).toBeNull();
  });

  it("refuses the author's own offer", () => {
    expect(refusal({ authorId: PLAYER })).toBe("OWN_OFFER");
  });

  it("refuses two players who have blocked each other", () => {
    expect(refusal({ blocked: true })).toBe("BLOCKED");
  });

  it("refuses an offer that has started or is in the past", () => {
    expect(refusal({ startsAt: NOW })).toBe("STARTED");
  });

  it.each(["OPEN", "CANCELLED"] as const)(
    "refuses joining the waitlist of a %s offer",
    (status) => {
      expect(refusal({ status })).toBe("NOT_FULL");
    },
  );

  it.each(["REQUESTED", "ACCEPTED"] as const)(
    "refuses a player who already has a %s join on this offer",
    (status) => {
      expect(refusal({ existingJoin: { status } })).toBe("ALREADY_JOINED");
    },
  );

  it("refuses a player the author has declined", () => {
    expect(refusal({ existingJoin: { status: "DECLINED" } })).toBe("DECLINED");
  });

  it("lets a player who withdrew join the waitlist", () => {
    expect(refusal({ existingJoin: { status: "WITHDRAWN" } })).toBeNull();
  });

  it("refuses a player already on the waitlist", () => {
    expect(refusal({ alreadyWaitlisted: true })).toBe("ALREADY_WAITLISTED");
  });
});

describe("waitlistPosition", () => {
  const entries = [{ userId: "a" }, { userId: "b" }, { userId: "c" }];

  it("is 1-based, in the given order", () => {
    expect(waitlistPosition(entries, "a")).toBe(1);
    expect(waitlistPosition(entries, "b")).toBe(2);
    expect(waitlistPosition(entries, "c")).toBe(3);
  });

  it("is null when the player isn't in the list", () => {
    expect(waitlistPosition(entries, "nobody")).toBeNull();
  });
});

describe("isWaitlistOfferStale", () => {
  const FAR_OFF = new Date("2026-10-20T16:00:00Z");

  it("isn't stale before the 2h window elapses", () => {
    const offeredAt = new Date(NOW.getTime() - 1 * 3_600_000);
    expect(isWaitlistOfferStale({ startsAt: FAR_OFF }, offeredAt, NOW)).toBe(
      false,
    );
  });

  it("is stale once 2h have passed with the offer still far off", () => {
    const offeredAt = new Date(NOW.getTime() - 2 * 3_600_000);
    expect(isWaitlistOfferStale({ startsAt: FAR_OFF }, offeredAt, NOW)).toBe(
      true,
    );
  });

  it("uses the shorter 1h window once the offer starts in under 3h", () => {
    const soon = new Date(NOW.getTime() + 2 * 3_600_000);
    const offeredAt = new Date(NOW.getTime() - 1 * 3_600_000);
    expect(isWaitlistOfferStale({ startsAt: soon }, offeredAt, NOW)).toBe(true);
  });

  it("isn't stale before even the shorter 1h window elapses", () => {
    const soon = new Date(NOW.getTime() + 2 * 3_600_000);
    const offeredAt = new Date(NOW.getTime() - 30 * 60_000);
    expect(isWaitlistOfferStale({ startsAt: soon }, offeredAt, NOW)).toBe(
      false,
    );
  });
});
