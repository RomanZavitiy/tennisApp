import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createOffer } from "@/app/(member)/offers/new/actions";

// Session, database and redirect are replaced: what's under test is who gets
// to post, what reaches the database and what never does.
const ME = "11111111-1111-4111-8111-111111111111";
const SOMEONE_ELSE = "22222222-2222-4222-8222-222222222222";
const CLUB = "33333333-3333-4333-8333-333333333333";
const OFFER = "44444444-4444-4444-8444-444444444444";

const {
  requireOnboardedUser,
  clubFindUnique,
  offerCount,
  offerCreate,
  redirect,
  notifyInterestedPlayers,
  checkRateLimit,
} = vi.hoisted(() => ({
  requireOnboardedUser: vi.fn(),
  clubFindUnique: vi.fn(),
  offerCount: vi.fn(),
  offerCreate:
    vi.fn<
      (args: {
        data: Record<string, unknown>;
        select: { id: true };
      }) => Promise<{ id: string }>
    >(),
  redirect: vi.fn(),
  notifyInterestedPlayers: vi.fn(),
  checkRateLimit: vi.fn(),
}));

vi.mock("@/lib/auth/require-onboarded-user", () => ({ requireOnboardedUser }));
vi.mock("@/lib/db", () => ({
  db: {
    club: { findUnique: clubFindUnique },
    sparringOffer: { count: offerCount, create: offerCreate },
  },
}));
// The matching push is its own concern (lib/notifications/new-offer.test.ts).
vi.mock("@/lib/notifications/new-offer", () => ({ notifyInterestedPlayers }));
// Rate limiting (6.16-6.18) is its own concern
// (lib/rate-limit/check-rate-limit.test.ts); here only that a limit refuses
// the post matters (tested explicitly below).
vi.mock("@/lib/rate-limit/check-rate-limit", () => ({ checkRateLimit }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect }));

const valid = { startsAt: "2026-10-20T18:00", district: "KROWODRZA" };

describe("createOffer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-11T10:00:00Z"));
    requireOnboardedUser.mockResolvedValue({ id: ME });
    offerCount.mockResolvedValue(0);
    offerCreate.mockResolvedValue({ id: OFFER });
    notifyInterestedPlayers.mockResolvedValue(undefined);
    checkRateLimit.mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("refuses a blocked player without writing", async () => {
    requireOnboardedUser.mockResolvedValue({
      id: ME,
      blockedAt: new Date("2026-10-11T09:00:00Z"),
    });

    const result = await createOffer(valid);

    expect(result).toEqual({
      ok: false,
      fieldErrors: {},
      message:
        "Your account is blocked pending a review. You can't create offers, join requests or messages until an admin makes a decision.",
    });
    expect(offerCreate).not.toHaveBeenCalled();
  });

  it("refuses once the active-offer limit is reached", async () => {
    offerCount.mockResolvedValue(5);

    const result = await createOffer(valid);

    expect(result).toEqual({
      ok: false,
      fieldErrors: {},
      message:
        "You already have 5 offers out there. Cancel one before posting another.",
    });
    expect(offerCreate).not.toHaveBeenCalled();
  });

  it("refuses once the daily new-offer limit is hit", async () => {
    checkRateLimit.mockResolvedValue({ ok: false });

    const result = await createOffer(valid);

    expect(result).toEqual({
      ok: false,
      fieldErrors: {},
      message: "You've posted a lot of offers today. Try again tomorrow.",
    });
    expect(checkRateLimit).toHaveBeenCalledWith(ME, "NEW_OFFER");
    expect(offerCreate).not.toHaveBeenCalled();
  });

  it("saves the offer as the signed-in player's and opens it", async () => {
    await createOffer({ ...valid, comment: " Evening game " });

    expect(offerCreate).toHaveBeenCalledWith({
      data: {
        format: "SINGLES",
        hasPartner: false,
        startsAt: new Date("2026-10-20T16:00:00Z"),
        durationMinutes: 90,
        district: "KROWODRZA",
        courtStatus: "WILL_BOOK",
        comment: "Evening game",
        authorId: ME,
      },
      select: { id: true },
    });
    expect(redirect).toHaveBeenCalledWith(`/offers/${OFFER}?created=1`);
    expect(notifyInterestedPlayers).toHaveBeenCalledWith({
      offerId: OFFER,
      authorId: ME,
      district: "KROWODRZA",
      ntrpMin: null,
      ntrpMax: null,
    });
  });

  it("takes the author from the session, not from the request", async () => {
    await createOffer({ ...valid, authorId: SOMEONE_ELSE, status: "FULL" });

    const data = offerCreate.mock.calls[0]?.[0].data;
    expect(data.authorId).toBe(ME);
    expect(data).not.toHaveProperty("status");
  });

  it("refuses a request without a session", async () => {
    requireOnboardedUser.mockRejectedValue(new Error("not signed in"));

    await expect(createOffer(valid)).rejects.toThrow("not signed in");
    expect(offerCreate).not.toHaveBeenCalled();
  });

  it("refuses a player without a finished profile", async () => {
    // requireOnboardedUser() redirects to /onboarding, which throws.
    requireOnboardedUser.mockRejectedValue(new Error("NEXT_REDIRECT"));

    await expect(createOffer(valid)).rejects.toThrow("NEXT_REDIRECT");
    expect(offerCreate).not.toHaveBeenCalled();
  });

  it("returns field errors for invalid data without saving", async () => {
    const result = await createOffer({
      startsAt: "2026-10-01T18:00",
      hasPartner: true,
      ntrpMin: 5,
      ntrpMax: 3,
    });

    expect(result.fieldErrors).toEqual({
      startsAt: "That time has already passed.",
      hasPartner: "A partner can only be added to a doubles game.",
      district: "Choose a club or a district.",
      ntrpMax: "The highest level can't be below the lowest.",
    });
    expect(offerCreate).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("uses the club's district instead of the one sent", async () => {
    clubFindUnique.mockResolvedValue({ district: "DEBNIKI" });

    await createOffer({ ...valid, clubId: CLUB });

    expect(offerCreate.mock.calls[0]?.[0].data).toMatchObject({
      clubId: CLUB,
      district: "DEBNIKI",
    });
  });

  it("leaves the district empty for a club outside the city", async () => {
    clubFindUnique.mockResolvedValue({ district: null });

    await createOffer({ startsAt: valid.startsAt, clubId: CLUB });

    expect(offerCreate.mock.calls[0]?.[0].data).toMatchObject({
      clubId: CLUB,
      district: null,
    });
  });

  it("refuses a club that doesn't exist", async () => {
    clubFindUnique.mockResolvedValue(null);

    const result = await createOffer({ ...valid, clubId: CLUB });

    expect(result.fieldErrors).toEqual({
      clubId: "Choose a club from the list.",
    });
    expect(offerCreate).not.toHaveBeenCalled();
  });
});
