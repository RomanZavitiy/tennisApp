import { beforeEach, describe, expect, it, vi } from "vitest";

import { exportUserData } from "@/lib/privacy/export-user-data";

const ME = "11111111-1111-4111-8111-111111111111";
const OPPONENT_AS_AUTHOR = "22222222-2222-4222-8222-222222222222";

const {
  userFindUniqueOrThrow,
  offerFindMany,
  joinFindMany,
  messageFindMany,
  matchResultFindMany,
} = vi.hoisted(() => ({
  userFindUniqueOrThrow: vi.fn(),
  offerFindMany: vi.fn(),
  joinFindMany: vi.fn(),
  messageFindMany: vi.fn(),
  matchResultFindMany: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    user: { findUniqueOrThrow: userFindUniqueOrThrow },
    sparringOffer: { findMany: offerFindMany },
    offerJoin: { findMany: joinFindMany },
    message: { findMany: messageFindMany },
    matchResult: { findMany: matchResultFindMany },
  },
}));

describe("exportUserData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userFindUniqueOrThrow.mockResolvedValue({
      id: ME,
      email: "ola@example.com",
      name: "Ola Kowalska",
      birthDate: new Date("1995-04-12T00:00:00Z"),
      gender: "FEMALE",
      district: "KROWODRZA",
      selfRatedNtrp: 3.5,
      elo: 1420,
      matchesPlayed: 3,
      locale: "EN",
      createdAt: new Date("2026-09-01T10:00:00Z"),
    });
    offerFindMany.mockResolvedValue([]);
    joinFindMany.mockResolvedValue([]);
    messageFindMany.mockResolvedValue([]);
    matchResultFindMany.mockResolvedValue([]);
  });

  it("includes only the exported user's own profile, offers, joins and messages", async () => {
    offerFindMany.mockResolvedValue([
      {
        id: "offer-1",
        status: "OPEN",
        format: "SINGLES",
        startsAt: new Date("2026-10-20T17:00:00Z"),
        district: "KROWODRZA",
        clubId: null,
        comment: null,
        courtStatus: "WILL_BOOK",
        createdAt: new Date("2026-10-01T10:00:00Z"),
      },
    ]);
    messageFindMany.mockResolvedValue([
      {
        id: "msg-1",
        offerJoinId: "join-1",
        offerId: null,
        content: "See you at 5pm",
        createdAt: new Date("2026-10-02T10:00:00Z"),
      },
    ]);

    const result = await exportUserData(ME);

    expect(offerFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { authorId: ME } }),
    );
    expect(messageFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { senderId: ME } }),
    );
    expect(result.profile).toMatchObject({ id: ME, email: "ola@example.com" });
    expect(result.offers).toHaveLength(1);
    expect(result.messages[0]?.content).toBe("See you at 5pm");
  });

  it("shows a match opponent only as first name + last initial, never in full", async () => {
    matchResultFindMany.mockResolvedValue([
      {
        id: "result-1",
        status: "CONFIRMED",
        score: [{ me: 6, opponent: 4 }],
        winner: "PLAYER",
        reportedBy: "PLAYER",
        noShowParty: null,
        createdAt: new Date("2026-10-05T10:00:00Z"),
        offerJoin: {
          userId: ME,
          user: { name: "Ola Kowalska" },
          offer: {
            authorId: OPPONENT_AS_AUTHOR,
            startsAt: new Date("2026-10-04T17:00:00Z"),
            author: { name: "Marek Nowicki" },
          },
        },
      },
    ]);

    const result = await exportUserData(ME);

    expect(result.matches).toEqual([
      {
        id: "result-1",
        status: "CONFIRMED",
        startsAt: "2026-10-04T17:00:00.000Z",
        opponent: "Marek N.",
        score: [{ me: 6, opponent: 4 }],
        winner: "me",
        reportedBy: "me",
        noShowParty: null,
        createdAt: "2026-10-05T10:00:00.000Z",
      },
    ]);
    expect(JSON.stringify(result)).not.toContain("Nowicki");
  });

  it("maps winner/reportedBy relative to the exported user when they are the offer's author", async () => {
    matchResultFindMany.mockResolvedValue([
      {
        id: "result-2",
        status: "CONFIRMED",
        score: [{ me: 4, opponent: 6 }],
        winner: "PLAYER",
        reportedBy: "PLAYER",
        noShowParty: null,
        createdAt: new Date("2026-10-06T10:00:00Z"),
        offerJoin: {
          userId: OPPONENT_AS_AUTHOR,
          user: { name: "Marek Nowicki" },
          offer: {
            authorId: ME,
            startsAt: new Date("2026-10-06T17:00:00Z"),
            author: { name: "Ola Kowalska" },
          },
        },
      },
    ]);

    const result = await exportUserData(ME);

    expect(result.matches[0]).toMatchObject({
      opponent: "Marek N.",
      winner: "opponent",
      reportedBy: "opponent",
    });
  });
});
