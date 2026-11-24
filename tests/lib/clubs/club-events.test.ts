import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  CLUB_EVENTS_PER_DAY,
  canPostClubEvent,
  getClubEvents,
} from "@/lib/clubs/club-events";

// The database is replaced: what's under test is the query shape of club
// news (slice PD5, task PD5.1) and the rolling daily limit.
const { eventFindMany, eventCount } = vi.hoisted(() => ({
  eventFindMany: vi.fn(),
  eventCount: vi.fn(),
}));
vi.mock("@/lib/db", () => ({
  db: { clubEvent: { findMany: eventFindMany, count: eventCount } },
}));

const NOW = new Date("2026-11-24T20:00:00Z");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getClubEvents", () => {
  it("reads one club's newest news first, five by default", async () => {
    eventFindMany.mockResolvedValue([]);

    await getClubEvents("club-1");

    expect(eventFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { clubId: "club-1" },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    );
  });
});

describe("canPostClubEvent", () => {
  it("counts the last 24 hours, not the calendar day", async () => {
    eventCount.mockResolvedValue(0);

    await canPostClubEvent("club-1", NOW);

    expect(eventCount).toHaveBeenCalledWith({
      where: {
        clubId: "club-1",
        createdAt: { gt: new Date("2026-11-23T20:00:00Z") },
      },
    });
  });

  it("allows up to the limit and no more", async () => {
    eventCount.mockResolvedValue(CLUB_EVENTS_PER_DAY - 1);
    expect(await canPostClubEvent("club-1", NOW)).toBe(true);

    eventCount.mockResolvedValue(CLUB_EVENTS_PER_DAY);
    expect(await canPostClubEvent("club-1", NOW)).toBe(false);
  });
});
