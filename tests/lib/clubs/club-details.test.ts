import { createFormatter } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  formatCheckedDate,
  getClub,
  getClubFollowInfo,
} from "@/lib/clubs/club-details";
import { IndoorCourts, Surface } from "@/lib/generated/prisma/enums";
import en from "@/messages/en.json";
import pl from "@/messages/pl.json";

const { findUnique, followCount, followFindUnique } = vi.hoisted(() => ({
  findUnique: vi.fn(),
  followCount: vi.fn(),
  followFindUnique: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    club: { findUnique },
    clubFollow: { count: followCount, findUnique: followFindUnique },
  },
}));

const ID = "11111111-1111-4111-8111-111111111111";
const VIEWER = "22222222-2222-4222-8222-222222222222";

describe("getClub", () => {
  beforeEach(() => {
    findUnique.mockReset();
  });

  it("looks the club up by id", async () => {
    findUnique.mockResolvedValue({ id: ID, name: "Olsza" });

    expect(await getClub(ID)).toEqual({ id: ID, name: "Olsza" });
    expect(findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: ID } }),
    );
  });

  it("returns null for an unknown id", async () => {
    findUnique.mockResolvedValue(null);

    expect(await getClub(ID)).toBeNull();
  });

  it("returns null for a non-UUID without asking the database", async () => {
    expect(await getClub("not-a-uuid")).toBeNull();
    expect(findUnique).not.toHaveBeenCalled();
  });
});

describe("getClubFollowInfo (task O.4)", () => {
  beforeEach(() => {
    followCount.mockReset();
    followFindUnique.mockReset();
  });

  it("reports the follower count with no viewer following", async () => {
    followCount.mockResolvedValue(3);

    expect(await getClubFollowInfo(ID, null)).toEqual({
      followerCount: 3,
      viewerFollows: false,
    });
    expect(followFindUnique).not.toHaveBeenCalled();
  });

  it("reports whether the viewer follows this club", async () => {
    followCount.mockResolvedValue(3);
    followFindUnique.mockResolvedValue({ id: "follow-1" });

    expect(await getClubFollowInfo(ID, VIEWER)).toEqual({
      followerCount: 3,
      viewerFollows: true,
    });
    expect(followFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_clubId: { userId: VIEWER, clubId: ID } },
      }),
    );
  });

  it("a signed-in viewer who doesn't follow gets false, not a crash", async () => {
    followCount.mockResolvedValue(0);
    followFindUnique.mockResolvedValue(null);

    expect(await getClubFollowInfo(ID, VIEWER)).toEqual({
      followerCount: 0,
      viewerFollows: false,
    });
  });
});

describe("labels (task 1.20)", () => {
  it("has an EN and PL label for every surface and indoor value", () => {
    for (const messages of [en, pl]) {
      expect(Object.keys(messages.Surface).sort()).toEqual(
        Object.values(Surface).sort(),
      );
      expect(Object.keys(messages.IndoorCourts).sort()).toEqual(
        Object.values(IndoorCourts).sort(),
      );
    }
  });
});

describe("formatCheckedDate", () => {
  it("shows the stored date, whatever the server's time zone", () => {
    const format = createFormatter({ locale: "en", timeZone: "Europe/Warsaw" });
    expect(formatCheckedDate(format, new Date("2026-10-09T00:00:00Z"))).toBe(
      "October 9, 2026",
    );
  });
});
