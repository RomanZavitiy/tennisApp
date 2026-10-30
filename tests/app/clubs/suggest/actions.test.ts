import { beforeEach, describe, expect, it, vi } from "vitest";

import { submitClub } from "@/app/clubs/suggest/actions";

// Session and database are replaced: what's under test is who gets to
// suggest a club, what reaches the database and what never does.
const ME = "11111111-1111-4111-8111-111111111111";

const { requireOnboardedUser, clubSubmissionCreate, checkRateLimit } =
  vi.hoisted(() => ({
    requireOnboardedUser: vi.fn(),
    clubSubmissionCreate: vi.fn(),
    checkRateLimit: vi.fn(),
  }));

vi.mock("@/lib/auth/require-onboarded-user", () => ({ requireOnboardedUser }));
vi.mock("@/lib/db", () => ({
  db: { clubSubmission: { create: clubSubmissionCreate } },
}));
// Rate limiting (6.16-6.18, M.3) is its own concern
// (lib/rate-limit/check-rate-limit.test.ts); here only that a limit refuses
// the submission matters (tested explicitly below).
vi.mock("@/lib/rate-limit/check-rate-limit", () => ({ checkRateLimit }));

const valid = { name: "Kort Krowodrza", address: "ul. Przykładowa 1" };

describe("submitClub", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireOnboardedUser.mockResolvedValue({ id: ME, blockedAt: null });
    clubSubmissionCreate.mockResolvedValue({ id: "submission-id" });
    checkRateLimit.mockResolvedValue({ ok: true });
  });

  it("refuses a blocked player without writing", async () => {
    requireOnboardedUser.mockResolvedValue({
      id: ME,
      blockedAt: new Date("2026-10-29T09:00:00Z"),
    });

    const result = await submitClub(valid);

    expect(result).toEqual({
      ok: false,
      fieldErrors: {},
      message:
        "Your account is blocked pending a review. You can't create offers, join requests or messages until an admin makes a decision.",
    });
    expect(clubSubmissionCreate).not.toHaveBeenCalled();
  });

  it("refuses invalid input without writing", async () => {
    const result = await submitClub({ name: "", address: "" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors.name).toBeTruthy();
      expect(result.fieldErrors.address).toBeTruthy();
    }
    expect(clubSubmissionCreate).not.toHaveBeenCalled();
  });

  it("refuses once the daily limit is hit", async () => {
    checkRateLimit.mockResolvedValue({ ok: false });

    const result = await submitClub(valid);

    expect(result).toEqual({
      ok: false,
      fieldErrors: {},
      message: "You've suggested a few clubs today. Try again tomorrow.",
    });
    expect(checkRateLimit).toHaveBeenCalledWith(ME, "CLUB_SUBMISSION");
    expect(clubSubmissionCreate).not.toHaveBeenCalled();
  });

  it("saves the submission as the signed-in player's, PENDING by default", async () => {
    const result = await submitClub({
      ...valid,
      districtGuess: "KROWODRZA",
      notes: " Two clay courts ",
    });

    expect(result).toEqual({ ok: true });
    expect(clubSubmissionCreate).toHaveBeenCalledWith({
      data: {
        name: "Kort Krowodrza",
        address: "ul. Przykładowa 1",
        districtGuess: "KROWODRZA",
        notes: "Two clay courts",
        submittedById: ME,
      },
      select: { id: true },
    });
  });

  it("omits district and notes when not given", async () => {
    await submitClub(valid);

    expect(clubSubmissionCreate).toHaveBeenCalledWith({
      data: { ...valid, submittedById: ME },
      select: { id: true },
    });
  });
});
