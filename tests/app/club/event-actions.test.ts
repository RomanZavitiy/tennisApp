import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  deleteClubEvent,
  postClubEvent,
} from "@/app/(club)/club/[clubId]/event-actions";
import { features } from "@/lib/features";

// Session and database are replaced: what's under test is who may post or
// delete club news (slice PD5, task PD5.1), the daily limit, the push to
// followers, and that it all stays shut while the club chat flag is off.
const CLUB = "11111111-1111-4111-8111-111111111111";
const STAFF = "55555555-5555-4555-8555-555555555555";
const EVENT = "66666666-6666-4666-8666-666666666666";

const {
  requireClubStaff,
  clubFindUnique,
  eventCreate,
  eventFindUnique,
  eventDelete,
  canPostClubEvent,
  notifyClubFollowers,
  captureEvent,
} = vi.hoisted(() => ({
  requireClubStaff: vi.fn(),
  clubFindUnique: vi.fn(),
  eventCreate: vi.fn(),
  eventFindUnique: vi.fn(),
  eventDelete: vi.fn(),
  canPostClubEvent: vi.fn(),
  notifyClubFollowers: vi.fn(),
  captureEvent: vi.fn(),
}));

vi.mock("@/lib/auth/require-club-staff", () => ({ requireClubStaff }));
vi.mock("@/lib/db", () => ({
  db: {
    club: { findUnique: clubFindUnique },
    clubEvent: {
      create: eventCreate,
      findUnique: eventFindUnique,
      delete: eventDelete,
    },
  },
}));
vi.mock("@/lib/clubs/club-events", () => ({ canPostClubEvent }));
vi.mock("@/lib/notifications/club-event-notify", () => ({
  notifyClubFollowers,
}));
vi.mock("@/lib/analytics/posthog", () => ({ captureEvent }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const NEWS = {
  title: "  Padel night  ",
  body: "Friday from 19:00, all levels.",
};

const clubChatDefault = features.clubChat;
beforeEach(() => {
  vi.clearAllMocks();
  features.clubChat = true;
  requireClubStaff.mockResolvedValue({ id: STAFF, clubId: CLUB });
  clubFindUnique.mockResolvedValue({ id: CLUB, name: "Blonia Sport" });
  canPostClubEvent.mockResolvedValue(true);
  notifyClubFollowers.mockResolvedValue(["fan-1", "fan-2"]);
});
afterEach(() => {
  features.clubChat = clubChatDefault;
});

describe("postClubEvent", () => {
  it("saves trimmed news, pushes it to followers and logs how many got it", async () => {
    expect(await postClubEvent(CLUB, NEWS)).toEqual({ ok: true });

    expect(requireClubStaff).toHaveBeenCalledWith(CLUB);
    expect(eventCreate).toHaveBeenCalledWith({
      data: {
        clubId: CLUB,
        authorId: STAFF,
        title: "Padel night",
        body: "Friday from 19:00, all levels.",
      },
    });
    expect(notifyClubFollowers).toHaveBeenCalledWith({
      clubId: CLUB,
      clubName: "Blonia Sport",
      title: "Padel night",
      body: "Friday from 19:00, all levels.",
      authorId: STAFF,
    });
    expect(captureEvent).toHaveBeenCalledWith("club_event_posted", STAFF, {
      followers_notified: 2,
    });
  });

  it("refuses a blank title without saving", async () => {
    const result = await postClubEvent(CLUB, { ...NEWS, title: "   " });

    expect(result).toEqual({ ok: false, message: "Add a title." });
    expect(eventCreate).not.toHaveBeenCalled();
  });

  it("refuses past the daily limit", async () => {
    canPostClubEvent.mockResolvedValue(false);

    const result = await postClubEvent(CLUB, NEWS);

    expect(result).toEqual({
      ok: false,
      message: "A club can post up to 3 news items a day. Try again tomorrow.",
    });
    expect(eventCreate).not.toHaveBeenCalled();
    expect(notifyClubFollowers).not.toHaveBeenCalled();
  });

  it("lets the staff check's 404 through for someone who is not staff", async () => {
    requireClubStaff.mockRejectedValue(new Error("NEXT_NOT_FOUND"));

    await expect(postClubEvent(CLUB, NEWS)).rejects.toThrow("NEXT_NOT_FOUND");
    expect(eventCreate).not.toHaveBeenCalled();
  });

  it("refuses a malformed club id before checking staff", async () => {
    const result = await postClubEvent("not-a-uuid", NEWS);

    expect(result.ok).toBe(false);
    expect(requireClubStaff).not.toHaveBeenCalled();
  });

  it("refuses while the club chat flag is off", async () => {
    features.clubChat = false;

    const result = await postClubEvent(CLUB, NEWS);

    expect(result.ok).toBe(false);
    expect(requireClubStaff).not.toHaveBeenCalled();
    expect(eventCreate).not.toHaveBeenCalled();
  });
});

describe("deleteClubEvent", () => {
  it("deletes news of the staff member's own club", async () => {
    eventFindUnique.mockResolvedValue({ id: EVENT, clubId: CLUB });

    expect(await deleteClubEvent(EVENT)).toEqual({ ok: true });
    expect(requireClubStaff).toHaveBeenCalledWith(CLUB);
    expect(eventDelete).toHaveBeenCalledWith({ where: { id: EVENT } });
  });

  it("checks staff of the club the news belongs to", async () => {
    eventFindUnique.mockResolvedValue({ id: EVENT, clubId: CLUB });
    requireClubStaff.mockRejectedValue(new Error("NEXT_NOT_FOUND"));

    await expect(deleteClubEvent(EVENT)).rejects.toThrow("NEXT_NOT_FOUND");
    expect(eventDelete).not.toHaveBeenCalled();
  });

  it("answers 'not found' for missing news", async () => {
    eventFindUnique.mockResolvedValue(null);

    const result = await deleteClubEvent(EVENT);

    expect(result).toEqual({
      ok: false,
      message: "This news item no longer exists.",
    });
    expect(eventDelete).not.toHaveBeenCalled();
  });

  it("refuses while the club chat flag is off", async () => {
    features.clubChat = false;

    expect((await deleteClubEvent(EVENT)).ok).toBe(false);
    expect(eventFindUnique).not.toHaveBeenCalled();
  });
});
