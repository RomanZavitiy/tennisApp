import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  addBlock,
  confirmBooking,
  declineBooking,
  removeBlock,
} from "@/app/(club)/club/[clubId]/actions";

// Session and database are replaced: what's under test is who may confirm/
// decline a request or add/remove a block, that a decided request can't be
// decided again, and that a block can't be added over a live booking.
const CLUB = "11111111-1111-4111-8111-111111111111";
const COURT = "22222222-2222-4222-8222-222222222222";
const BOOKING = "33333333-3333-4333-8333-333333333333";
const PLAYER = "44444444-4444-4444-8444-444444444444";
const STAFF = "55555555-5555-4555-8555-555555555555";
const BLOCK = "66666666-6666-4666-8666-666666666666";
const OFFER = "77777777-7777-4777-8777-777777777777";

const {
  requireClubStaff,
  bookingFindUnique,
  bookingUpdate,
  bookingCount,
  courtFindUnique,
  courtBlockCreate,
  courtBlockFindUnique,
  courtBlockDelete,
  offerFindUnique,
  offerUpdate,
  joinFindMany,
  notifyBookingDecided,
  notify,
  postSystemMessage,
  captureEvent,
} = vi.hoisted(() => ({
  requireClubStaff: vi.fn(),
  bookingFindUnique: vi.fn(),
  bookingUpdate: vi.fn(),
  bookingCount: vi.fn(),
  courtFindUnique: vi.fn(),
  courtBlockCreate: vi.fn(),
  courtBlockFindUnique: vi.fn(),
  courtBlockDelete: vi.fn(),
  offerFindUnique: vi.fn(),
  offerUpdate: vi.fn(),
  joinFindMany: vi.fn(),
  notifyBookingDecided: vi.fn(),
  notify: vi.fn(),
  postSystemMessage: vi.fn(),
  captureEvent: vi.fn(),
}));

vi.mock("@/lib/auth/require-club-staff", () => ({ requireClubStaff }));
vi.mock("@/lib/db", () => ({
  db: {
    booking: {
      findUnique: bookingFindUnique,
      update: bookingUpdate,
      count: bookingCount,
    },
    court: { findUnique: courtFindUnique },
    courtBlock: {
      create: courtBlockCreate,
      findUnique: courtBlockFindUnique,
      delete: courtBlockDelete,
    },
    // K.21: confirmBooking reuses markOfferCourtBooked for a booking that
    // came from an offer's page.
    sparringOffer: { findUnique: offerFindUnique, update: offerUpdate },
    offerJoin: { findMany: joinFindMany },
  },
}));
vi.mock("@/lib/notifications/notify", () => ({ notifyBookingDecided, notify }));
vi.mock("@/lib/messages/post-system-message", () => ({
  postSystemMessage,
  COURT_BOOKED_MESSAGE: "COURT_BOOKED_MESSAGE",
}));
vi.mock("@/lib/analytics/posthog", () => ({ captureEvent }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const PENDING_BOOKING = {
  id: BOOKING,
  status: "PENDING",
  startsAt: new Date("2026-11-05T17:00:00.000Z"),
  endsAt: new Date("2026-11-05T18:00:00.000Z"),
  userId: PLAYER,
  court: { id: COURT, name: "Court 1", clubId: CLUB },
};

describe("confirmBooking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireClubStaff.mockResolvedValue({ id: STAFF, clubId: CLUB });
    bookingFindUnique.mockResolvedValue(PENDING_BOOKING);
    bookingUpdate.mockResolvedValue(undefined);
    notifyBookingDecided.mockResolvedValue(undefined);
    captureEvent.mockResolvedValue(undefined);
  });

  it("confirms a PENDING booking, notifies the player and logs the event", async () => {
    const result = await confirmBooking(BOOKING);

    expect(result).toEqual({ ok: true });
    expect(requireClubStaff).toHaveBeenCalledWith(CLUB);
    expect(bookingUpdate).toHaveBeenCalledWith({
      where: { id: BOOKING },
      data: {
        status: "CONFIRMED",
        decidedById: STAFF,
        decidedAt: expect.any(Date) as Date,
      },
    });
    expect(notifyBookingDecided).toHaveBeenCalledWith(
      PLAYER,
      expect.objectContaining({ court: "Court 1", status: "CONFIRMED" }),
    );
    expect(captureEvent).toHaveBeenCalledWith("booking_confirmed", STAFF, {});
  });

  it("marks the linked offer's court booked (K.21)", async () => {
    bookingFindUnique.mockResolvedValue({
      ...PENDING_BOOKING,
      offerId: OFFER,
    });
    offerFindUnique.mockResolvedValue({ courtStatus: "WILL_BOOK" });
    joinFindMany.mockResolvedValue([]);

    await confirmBooking(BOOKING);

    expect(offerUpdate).toHaveBeenCalledWith({
      where: { id: OFFER },
      data: { courtStatus: "BOOKED" },
    });
    expect(captureEvent).toHaveBeenCalledWith("court_marked_booked", STAFF, {});
  });

  it("doesn't touch the offer when the booking isn't linked to one", async () => {
    await confirmBooking(BOOKING);

    expect(offerFindUnique).not.toHaveBeenCalled();
    expect(offerUpdate).not.toHaveBeenCalled();
  });

  it("404s a non-staff member before revealing the booking exists", async () => {
    requireClubStaff.mockRejectedValue(new Error("not-found"));

    await expect(confirmBooking(BOOKING)).rejects.toThrow("not-found");
    expect(bookingUpdate).not.toHaveBeenCalled();
  });

  it("refuses a booking that was already decided", async () => {
    bookingFindUnique.mockResolvedValue({
      ...PENDING_BOOKING,
      status: "CONFIRMED",
    });

    const result = await confirmBooking(BOOKING);

    expect(result).toEqual({
      ok: false,
      message: "This request has already been confirmed or declined.",
    });
    expect(bookingUpdate).not.toHaveBeenCalled();
  });

  it("refuses a malformed id without querying the database", async () => {
    const result = await confirmBooking("not-a-uuid");

    expect(result).toEqual({
      ok: false,
      message: "This booking request doesn't exist.",
    });
    expect(bookingFindUnique).not.toHaveBeenCalled();
  });
});

describe("declineBooking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireClubStaff.mockResolvedValue({ id: STAFF, clubId: CLUB });
    bookingFindUnique.mockResolvedValue(PENDING_BOOKING);
    bookingUpdate.mockResolvedValue(undefined);
    notifyBookingDecided.mockResolvedValue(undefined);
    captureEvent.mockResolvedValue(undefined);
  });

  it("declines with a reason and passes it on to the player", async () => {
    const result = await declineBooking(
      BOOKING,
      "Court closed for maintenance",
    );

    expect(result).toEqual({ ok: true });
    expect(bookingUpdate).toHaveBeenCalledWith({
      where: { id: BOOKING },
      data: {
        status: "DECLINED",
        declineReason: "Court closed for maintenance",
        decidedById: STAFF,
        decidedAt: expect.any(Date) as Date,
      },
    });
    expect(notifyBookingDecided).toHaveBeenCalledWith(
      PLAYER,
      expect.objectContaining({
        status: "DECLINED",
        reason: "Court closed for maintenance",
      }),
    );
    expect(captureEvent).toHaveBeenCalledWith("booking_declined", STAFF, {});
  });

  it("declines without a reason", async () => {
    await declineBooking(BOOKING);

    expect(bookingUpdate).toHaveBeenCalledWith({
      where: { id: BOOKING },
      data: {
        status: "DECLINED",
        declineReason: undefined,
        decidedById: STAFF,
        decidedAt: expect.any(Date) as Date,
      },
    });
  });

  it("refuses a reason over 300 characters, rather than silently truncating it", async () => {
    const result = await declineBooking(BOOKING, "x".repeat(301));

    expect(result.ok).toBe(false);
    expect(bookingUpdate).not.toHaveBeenCalled();
  });
});

describe("addBlock", () => {
  const validInput = {
    courtId: COURT,
    startsAt: "2026-11-05T18:00",
    endsAt: "2026-11-05T19:00",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    requireClubStaff.mockResolvedValue({ id: STAFF, clubId: CLUB });
    courtFindUnique.mockResolvedValue({ id: COURT, clubId: CLUB });
    bookingCount.mockResolvedValue(0);
    courtBlockCreate.mockResolvedValue(undefined);
  });

  it("creates a block when the time is free", async () => {
    const result = await addBlock(validInput);

    expect(result).toEqual({ ok: true });
    expect(requireClubStaff).toHaveBeenCalledWith(CLUB);
    expect(courtBlockCreate).toHaveBeenCalledWith({
      data: {
        courtId: COURT,
        startsAt: new Date("2026-11-05T17:00:00.000Z"),
        endsAt: new Date("2026-11-05T18:00:00.000Z"),
        reason: undefined,
        createdById: STAFF,
      },
    });
  });

  it("reads a lost race against the EXCLUDE constraint as 'overlaps', not a 500", async () => {
    courtBlockCreate.mockRejectedValue({ code: "23P01" });

    const result = await addBlock(validInput);

    expect(result).toEqual({
      ok: false,
      message: "That time overlaps another block. Pick a different time.",
    });
  });

  it("lets any other database error propagate", async () => {
    courtBlockCreate.mockRejectedValue(new Error("connection lost"));

    await expect(addBlock(validInput)).rejects.toThrow("connection lost");
  });

  it("refuses a block overlapping a PENDING/CONFIRMED booking", async () => {
    bookingCount.mockResolvedValue(1);

    const result = await addBlock(validInput);

    expect(result).toEqual({
      ok: false,
      message:
        "That time overlaps a request or confirmed booking. Confirm or decline it first.",
    });
    expect(courtBlockCreate).not.toHaveBeenCalled();
  });

  it("refuses an end before the start, without querying staff", async () => {
    const result = await addBlock({
      ...validInput,
      endsAt: validInput.startsAt,
    });

    expect(result.ok).toBe(false);
    expect(requireClubStaff).not.toHaveBeenCalled();
    expect(courtBlockCreate).not.toHaveBeenCalled();
  });

  it("refuses an unknown court", async () => {
    courtFindUnique.mockResolvedValue(null);

    const result = await addBlock(validInput);

    expect(result).toEqual({
      ok: false,
      message: "This court doesn't exist.",
    });
    expect(requireClubStaff).not.toHaveBeenCalled();
  });
});

describe("removeBlock", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireClubStaff.mockResolvedValue({ id: STAFF, clubId: CLUB });
    courtBlockFindUnique.mockResolvedValue({
      id: BLOCK,
      court: { clubId: CLUB },
    });
    courtBlockDelete.mockResolvedValue(undefined);
  });

  it("removes the block once staff of the right club is confirmed", async () => {
    const result = await removeBlock(BLOCK);

    expect(result).toEqual({ ok: true });
    expect(requireClubStaff).toHaveBeenCalledWith(CLUB);
    expect(courtBlockDelete).toHaveBeenCalledWith({ where: { id: BLOCK } });
  });

  it("refuses an unknown block", async () => {
    courtBlockFindUnique.mockResolvedValue(null);

    const result = await removeBlock(BLOCK);

    expect(result).toEqual({
      ok: false,
      message: "This block doesn't exist.",
    });
    expect(requireClubStaff).not.toHaveBeenCalled();
  });
});
