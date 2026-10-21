import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { requestBooking } from "@/app/clubs/[id]/book/actions";

// Session and database are replaced: what's under test is who may request a
// slot, that it's re-checked right before the write, and that a race lost to
// the database's own EXCLUDE constraint (K.2) reads the same as "taken",
// never a 500.
const ME = "11111111-1111-4111-8111-111111111111";
const COURT = "22222222-2222-4222-8222-222222222222";
const CLUB = "33333333-3333-4333-8333-333333333333";
const STAFF_A = "44444444-4444-4444-8444-444444444444";
const STAFF_B = "55555555-5555-4555-8555-555555555555";
const BOOKING = "66666666-6666-4666-8666-666666666666";

const {
  requireOnboardedUser,
  courtFindUnique,
  bookingCount,
  bookingCreate,
  clubStaffFindMany,
  getDayGrid,
  checkRateLimit,
  notifyBookingRequested,
  captureEvent,
  redirect,
} = vi.hoisted(() => ({
  requireOnboardedUser: vi.fn(),
  courtFindUnique: vi.fn(),
  bookingCount: vi.fn(),
  bookingCreate:
    vi.fn<
      (args: { data: Record<string, unknown> }) => Promise<{ id: string }>
    >(),
  clubStaffFindMany: vi.fn(),
  getDayGrid: vi.fn(),
  checkRateLimit: vi.fn(),
  notifyBookingRequested: vi.fn(),
  captureEvent: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("@/lib/auth/require-onboarded-user", () => ({ requireOnboardedUser }));
vi.mock("@/lib/db", () => ({
  db: {
    court: { findUnique: courtFindUnique },
    booking: { count: bookingCount, create: bookingCreate },
    clubStaff: { findMany: clubStaffFindMany },
  },
}));
// getDayGrid (K.7) and canFit (K.4/K.5) are each their own tested concern —
// canFit stays real here (pure), only the DB-backed loader is replaced.
vi.mock("@/lib/booking/get-day-grid", () => ({ getDayGrid }));
vi.mock("@/lib/rate-limit/check-rate-limit", () => ({ checkRateLimit }));
vi.mock("@/lib/notifications/notify", () => ({ notifyBookingRequested }));
vi.mock("@/lib/analytics/posthog", () => ({ captureEvent }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect }));

// 2026-11-05 is winter time in Warsaw (CET, UTC+1) — 18:00 local is 17:00 UTC.
const STARTS_AT_LOCAL = "2026-11-05T18:00";
const STARTS_AT = new Date("2026-11-05T17:00:00.000Z");
const DURATION = 60;

function freeGrid(secondSlotStatus: "FREE" | "TAKEN" = "FREE") {
  const slot = (offsetMinutes: number, status: "FREE" | "TAKEN") => ({
    start: new Date(STARTS_AT.getTime() + offsetMinutes * 60_000),
    end: new Date(STARTS_AT.getTime() + (offsetMinutes + 30) * 60_000),
    status,
  });
  return {
    club: { id: CLUB, name: "Olsza" },
    courts: [
      {
        id: COURT,
        name: "Court 1",
        surface: "CLAY",
        indoor: false,
        pricePerHourPln: null,
      },
    ],
    grid: [
      {
        courtId: COURT,
        slots: [slot(0, "FREE"), slot(30, secondSlotStatus)],
      },
    ],
  };
}

const validInput = {
  courtId: COURT,
  startsAt: STARTS_AT_LOCAL,
  duration: DURATION,
};

describe("requestBooking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-01T10:00:00Z"));
    requireOnboardedUser.mockResolvedValue({ id: ME, blockedAt: null });
    checkRateLimit.mockResolvedValue({ ok: true });
    bookingCount.mockResolvedValue(0);
    courtFindUnique.mockResolvedValue({
      id: COURT,
      name: "Court 1",
      active: true,
      clubId: CLUB,
    });
    getDayGrid.mockResolvedValue(freeGrid());
    bookingCreate.mockResolvedValue({ id: BOOKING });
    clubStaffFindMany.mockResolvedValue([
      { userId: STAFF_A },
      { userId: STAFF_B },
    ]);
    notifyBookingRequested.mockResolvedValue(undefined);
    captureEvent.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("creates a PENDING booking, notifies every staff member, and redirects", async () => {
    await requestBooking(validInput);

    expect(bookingCreate).toHaveBeenCalledWith({
      data: {
        courtId: COURT,
        userId: ME,
        startsAt: STARTS_AT,
        endsAt: new Date(STARTS_AT.getTime() + DURATION * 60_000),
        note: undefined,
        offerId: undefined,
      },
    });
    expect(notifyBookingRequested).toHaveBeenCalledTimes(2);
    expect(notifyBookingRequested).toHaveBeenCalledWith(
      STAFF_A,
      expect.objectContaining({ clubId: CLUB }),
    );
    expect(captureEvent).toHaveBeenCalledWith("booking_requested", ME, {});
    expect(redirect).toHaveBeenCalledWith("/profile");
  });

  it("refuses a blocked player without writing", async () => {
    requireOnboardedUser.mockResolvedValue({
      id: ME,
      blockedAt: new Date("2026-10-11T09:00:00Z"),
    });

    const result = await requestBooking(validInput);

    expect(result).toEqual({
      ok: false,
      message:
        "Your account is blocked pending a review. You can't create offers, join requests or messages until an admin makes a decision.",
    });
    expect(bookingCreate).not.toHaveBeenCalled();
  });

  it("refuses a request without a session or a finished profile", async () => {
    requireOnboardedUser.mockRejectedValue(new Error("NEXT_REDIRECT"));

    await expect(requestBooking(validInput)).rejects.toThrow("NEXT_REDIRECT");
    expect(bookingCreate).not.toHaveBeenCalled();
  });

  it("refuses once the daily rate limit is hit, before checking anything else", async () => {
    checkRateLimit.mockResolvedValue({ ok: false });

    const result = await requestBooking(validInput);

    expect(result).toEqual({
      ok: false,
      message:
        "You've sent a lot of booking requests today. Try again tomorrow.",
    });
    expect(checkRateLimit).toHaveBeenCalledWith(ME, "BOOKING_REQUEST");
    expect(bookingCount).not.toHaveBeenCalled();
    expect(bookingCreate).not.toHaveBeenCalled();
  });

  it("refuses a 4th PENDING request", async () => {
    bookingCount.mockResolvedValue(3);

    const result = await requestBooking(validInput);

    expect(result).toEqual({
      ok: false,
      message:
        "You already have 3 requests waiting on a decision. Wait for one to be confirmed or declined before sending another.",
    });
    expect(bookingCreate).not.toHaveBeenCalled();
  });

  it("refuses a slot a CourtBlock (or another booking) now covers", async () => {
    getDayGrid.mockResolvedValue(freeGrid("TAKEN"));

    const result = await requestBooking(validInput);

    expect(result).toEqual({
      ok: false,
      message: "That slot was just taken. Pick another time.",
    });
    expect(bookingCreate).not.toHaveBeenCalled();
  });

  it("reads a lost race against the EXCLUDE constraint as 'taken', not a 500", async () => {
    bookingCreate.mockRejectedValue({ code: "23P01" });

    const result = await requestBooking(validInput);

    expect(result).toEqual({
      ok: false,
      message: "That slot was just taken. Pick another time.",
    });
    expect(notifyBookingRequested).not.toHaveBeenCalled();
  });

  it("lets any other database error propagate", async () => {
    bookingCreate.mockRejectedValue(new Error("connection lost"));

    await expect(requestBooking(validInput)).rejects.toThrow("connection lost");
  });
});
