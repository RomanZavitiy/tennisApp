import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  reportClubMessage,
  sendClubMessage,
} from "@/app/clubs/[id]/chat-actions";

// Session and database are replaced: what's under test is who may write
// into a club's chat (followers only), the content and rate-limit rules,
// and that a report resolves its target the same way reportMessage
// (tests/app/offers/report-actions.test.ts) does.
const ME = "11111111-1111-4111-8111-111111111111";
const SENDER = "22222222-2222-4222-8222-222222222222";
const CLUB = "44444444-4444-4444-8444-444444444444";
const MESSAGE = "66666666-6666-4666-8666-666666666666";

const {
  requireOnboardedUser,
  followFindUnique,
  messageCreate,
  messageFindUnique,
  checkRateLimit,
  captureEvent,
  createReport,
} = vi.hoisted(() => ({
  requireOnboardedUser: vi.fn(),
  followFindUnique: vi.fn(),
  messageCreate: vi.fn(),
  messageFindUnique: vi.fn(),
  checkRateLimit: vi.fn(),
  captureEvent: vi.fn(),
  createReport: vi.fn(),
}));

vi.mock("@/lib/auth/require-onboarded-user", () => ({ requireOnboardedUser }));
vi.mock("@/lib/db", () => ({
  db: {
    clubFollow: { findUnique: followFindUnique },
    message: { create: messageCreate, findUnique: messageFindUnique },
  },
}));
vi.mock("@/lib/rate-limit/check-rate-limit", () => ({ checkRateLimit }));
vi.mock("@/lib/analytics/posthog", () => ({ captureEvent }));
vi.mock("@/lib/moderation/create-report", () => ({ createReport }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const createdAt = new Date("2026-11-01T10:00:00Z");

describe("sendClubMessage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireOnboardedUser.mockResolvedValue({ id: ME, blockedAt: null });
    followFindUnique.mockResolvedValue({ id: "follow-1" });
    checkRateLimit.mockResolvedValue({ ok: true });
    messageCreate.mockResolvedValue({
      id: MESSAGE,
      content: "Anyone up for Saturday?",
      senderId: ME,
      createdAt,
    });
  });

  it("refuses a blocked player without writing", async () => {
    requireOnboardedUser.mockResolvedValue({
      id: ME,
      blockedAt: new Date("2026-10-15T09:00:00Z"),
    });

    await expect(sendClubMessage(CLUB, "hi")).resolves.toEqual({
      ok: false,
      message:
        "Your account is blocked pending a review. You can't create offers, join requests or messages until an admin makes a decision.",
    });
    expect(messageCreate).not.toHaveBeenCalled();
  });

  it("refuses once the message rate limit is hit", async () => {
    checkRateLimit.mockResolvedValue({ ok: false });

    await expect(sendClubMessage(CLUB, "hi")).resolves.toEqual({
      ok: false,
      message: "You're sending messages too quickly. Wait a few minutes.",
    });
    expect(checkRateLimit).toHaveBeenCalledWith(ME, "MESSAGE");
    expect(messageCreate).not.toHaveBeenCalled();
  });

  it("refuses a non-follower as if the thread doesn't exist", async () => {
    followFindUnique.mockResolvedValue(null);

    await expect(sendClubMessage(CLUB, "hi")).resolves.toEqual({
      ok: false,
      message: "This conversation doesn't exist.",
    });
    expect(messageCreate).not.toHaveBeenCalled();
  });

  it("sends as the follower, and logs the event", async () => {
    await expect(
      sendClubMessage(CLUB, "Anyone up for Saturday?"),
    ).resolves.toEqual({
      ok: true,
      sentMessage: {
        id: MESSAGE,
        type: "TEXT",
        content: "Anyone up for Saturday?",
        senderId: ME,
        createdAt: createdAt.toISOString(),
      },
    });
    expect(messageCreate).toHaveBeenCalledWith({
      data: { clubId: CLUB, senderId: ME, content: "Anyone up for Saturday?" },
      select: { id: true, content: true, senderId: true, createdAt: true },
    });
    expect(captureEvent).toHaveBeenCalledWith("club_message_sent", ME, {});
  });

  it.each(["", "   "])("refuses an empty message %j", async (content) => {
    await expect(sendClubMessage(CLUB, content)).resolves.toEqual({
      ok: false,
      message: "Write a message.",
    });
    expect(messageCreate).not.toHaveBeenCalled();
  });

  it.each([undefined, "", "not-a-uuid", 42])(
    "treats a bad club id %j as a missing thread",
    async (clubId) => {
      await expect(sendClubMessage(clubId, "hi")).resolves.toEqual({
        ok: false,
        message: "This conversation doesn't exist.",
      });
      expect(followFindUnique).not.toHaveBeenCalled();
      expect(messageCreate).not.toHaveBeenCalled();
    },
  );
});

describe("reportClubMessage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireOnboardedUser.mockResolvedValue({ id: ME, blockedAt: null });
    followFindUnique.mockResolvedValue({ id: "follow-1" });
    messageFindUnique.mockResolvedValue({
      clubId: CLUB,
      type: "TEXT",
      senderId: SENDER,
    });
    createReport.mockResolvedValue({ ok: true });
  });

  const input = { reason: "ABUSIVE" };

  it("resolves the target from the message's sender, not the request", async () => {
    await reportClubMessage(CLUB, MESSAGE, input);

    expect(createReport).toHaveBeenCalledWith(
      expect.objectContaining({
        reporterId: ME,
        targetUserId: SENDER,
        messageId: MESSAGE,
        input: { reason: "ABUSIVE", comment: undefined },
      }),
    );
  });

  it("refuses a non-follower without reporting", async () => {
    followFindUnique.mockResolvedValue(null);

    await expect(reportClubMessage(CLUB, MESSAGE, input)).resolves.toEqual({
      ok: false,
      message: "This conversation doesn't exist.",
    });
    expect(createReport).not.toHaveBeenCalled();
  });

  it("refuses a message from a different club", async () => {
    messageFindUnique.mockResolvedValue({
      clubId: "99999999-9999-4999-8999-999999999999",
      type: "TEXT",
      senderId: SENDER,
    });

    await expect(reportClubMessage(CLUB, MESSAGE, input)).resolves.toEqual({
      ok: false,
      message: "This message doesn't exist.",
    });
    expect(createReport).not.toHaveBeenCalled();
  });

  it("refuses a SYSTEM message", async () => {
    messageFindUnique.mockResolvedValue({
      clubId: CLUB,
      type: "SYSTEM",
      senderId: null,
    });

    await expect(reportClubMessage(CLUB, MESSAGE, input)).resolves.toEqual({
      ok: false,
      message: "This message doesn't exist.",
    });
    expect(createReport).not.toHaveBeenCalled();
  });
});
