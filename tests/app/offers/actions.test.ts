import { beforeEach, describe, expect, it, vi } from "vitest";

import { requestToJoin } from "@/app/offers/[id]/actions";

// Session and database are replaced: what's under test is who may ask to
// join, which write happens, and that the answer reveals nothing else.
const ME = "11111111-1111-4111-8111-111111111111";
const AUTHOR = "22222222-2222-4222-8222-222222222222";
const OFFER = "44444444-4444-4444-8444-444444444444";
const JOIN = "55555555-5555-4555-8555-555555555555";

const {
  requireOnboardedUser,
  offerFindUnique,
  joinFindUnique,
  joinCreateMany,
  joinUpdateMany,
} = vi.hoisted(() => ({
  requireOnboardedUser: vi.fn(),
  offerFindUnique: vi.fn(),
  joinFindUnique: vi.fn(),
  joinCreateMany: vi.fn(),
  joinUpdateMany: vi.fn(),
}));

vi.mock("@/lib/auth/require-onboarded-user", () => ({ requireOnboardedUser }));
vi.mock("@/lib/db", () => ({
  db: {
    sparringOffer: { findUnique: offerFindUnique },
    offerJoin: {
      findUnique: joinFindUnique,
      createMany: joinCreateMany,
      updateMany: joinUpdateMany,
    },
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const upcoming = {
  authorId: AUTHOR,
  status: "OPEN",
  startsAt: new Date(Date.now() + 86_400_000),
};

describe("requestToJoin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireOnboardedUser.mockResolvedValue({ id: ME, name: "Ola" });
    offerFindUnique.mockResolvedValue(upcoming);
    joinFindUnique.mockResolvedValue(null);
    joinCreateMany.mockResolvedValue({ count: 1 });
    joinUpdateMany.mockResolvedValue({ count: 1 });
  });

  it("files a request as the signed-in player", async () => {
    await expect(requestToJoin(OFFER)).resolves.toEqual({ ok: true });

    expect(joinFindUnique).toHaveBeenCalledWith({
      where: { offerId_userId: { offerId: OFFER, userId: ME } },
      select: { id: true, status: true },
    });
    expect(joinCreateMany).toHaveBeenCalledWith({
      data: [{ offerId: OFFER, userId: ME }],
      skipDuplicates: true,
    });
  });

  it("refuses a request without a session or a finished profile", async () => {
    requireOnboardedUser.mockRejectedValue(new Error("NEXT_REDIRECT"));

    await expect(requestToJoin(OFFER)).rejects.toThrow("NEXT_REDIRECT");
    expect(joinCreateMany).not.toHaveBeenCalled();
  });

  it.each([undefined, "", "not-a-uuid", 42])(
    "treats a bad offer id %j as a missing offer",
    async (offerId) => {
      await expect(requestToJoin(offerId)).resolves.toEqual({
        ok: false,
        message: "This offer doesn't exist.",
      });
      expect(offerFindUnique).not.toHaveBeenCalled();
    },
  );

  it("refuses an offer that doesn't exist", async () => {
    offerFindUnique.mockResolvedValue(null);

    const result = await requestToJoin(OFFER);

    expect(result).toEqual({ ok: false, message: "This offer doesn't exist." });
    expect(joinCreateMany).not.toHaveBeenCalled();
  });

  it.each([
    ["own", { ...upcoming, authorId: ME }, null, "This is your own offer."],
    [
      "past",
      { ...upcoming, startsAt: new Date(Date.now() - 60_000) },
      null,
      "This game has already started.",
    ],
    [
      "full",
      { ...upcoming, status: "FULL" },
      null,
      "This offer is no longer taking players.",
    ],
    [
      "cancelled",
      { ...upcoming, status: "CANCELLED" },
      null,
      "This offer is no longer taking players.",
    ],
    [
      "already requested",
      upcoming,
      { id: JOIN, status: "REQUESTED" },
      "You have already asked to join.",
    ],
    [
      "declined",
      upcoming,
      { id: JOIN, status: "DECLINED" },
      "The author has declined your request.",
    ],
  ])(
    "refuses a %s offer without writing",
    async (_, offer, existing, message) => {
      offerFindUnique.mockResolvedValue(offer);
      joinFindUnique.mockResolvedValue(existing);

      await expect(requestToJoin(OFFER)).resolves.toEqual({
        ok: false,
        message,
      });
      expect(joinCreateMany).not.toHaveBeenCalled();
      expect(joinUpdateMany).not.toHaveBeenCalled();
    },
  );

  it("reopens a withdrawn request instead of adding a second row", async () => {
    joinFindUnique.mockResolvedValue({ id: JOIN, status: "WITHDRAWN" });

    await expect(requestToJoin(OFFER)).resolves.toEqual({ ok: true });

    expect(joinUpdateMany).toHaveBeenCalledWith({
      where: { id: JOIN, status: "WITHDRAWN" },
      data: { status: "REQUESTED" },
    });
    expect(joinCreateMany).not.toHaveBeenCalled();
  });

  it("reports a request that another click already filed", async () => {
    joinCreateMany.mockResolvedValue({ count: 0 });

    await expect(requestToJoin(OFFER)).resolves.toEqual({
      ok: false,
      message: "You have already asked to join.",
    });
  });

  it("answers without anyone's details", async () => {
    const result = await requestToJoin(OFFER);

    expect(Object.keys(result)).toEqual(["ok"]);
  });
});
