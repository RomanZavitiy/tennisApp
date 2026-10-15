import { beforeEach, describe, expect, it, vi } from "vitest";

import { sendMessage } from "@/app/offers/[id]/actions";

// Session and database are replaced: what's under test is who may write
// into a join's private thread, the content and read-only rules, and that
// the created row is what the thread (3.17) appends optimistically.
const ME = "11111111-1111-4111-8111-111111111111";
const AUTHOR = "22222222-2222-4222-8222-222222222222";
const STRANGER = "33333333-3333-4333-8333-333333333333";
const OFFER = "44444444-4444-4444-8444-444444444444";
const JOIN = "55555555-5555-4555-8555-555555555555";
const MESSAGE = "66666666-6666-4666-8666-666666666666";

const {
  requireOnboardedUser,
  joinFindUnique,
  messageCreate,
  notify,
  checkRateLimit,
} = vi.hoisted(() => ({
  requireOnboardedUser: vi.fn(),
  joinFindUnique: vi.fn(),
  messageCreate: vi.fn(),
  notify: vi.fn(),
  checkRateLimit: vi.fn(),
}));

vi.mock("@/lib/auth/require-onboarded-user", () => ({ requireOnboardedUser }));
vi.mock("@/lib/db", () => ({
  db: {
    offerJoin: { findUnique: joinFindUnique },
    message: { create: messageCreate },
  },
}));
// Push/email are a separate concern (lib/notifications/notify.test.ts) —
// here only that the right recipient and thread are passed matters.
vi.mock("@/lib/notifications/notify", () => ({ notify }));
// Rate limiting (6.16-6.18) is its own concern
// (lib/rate-limit/check-rate-limit.test.ts); here only that a limit refuses
// the send matters (tested explicitly below).
vi.mock("@/lib/rate-limit/check-rate-limit", () => ({ checkRateLimit }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const upcomingJoin = {
  userId: ME,
  status: "REQUESTED",
  offerId: OFFER,
  offer: { authorId: AUTHOR, startsAt: new Date(Date.now() + 86_400_000) },
};
const createdAt = new Date("2026-10-15T10:00:00Z");

describe("sendMessage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireOnboardedUser.mockResolvedValue({ id: ME });
    joinFindUnique.mockResolvedValue(upcomingJoin);
    messageCreate.mockResolvedValue({
      id: MESSAGE,
      content: "See you at 6?",
      senderId: ME,
      createdAt,
    });
    notify.mockResolvedValue(undefined);
    checkRateLimit.mockResolvedValue({ ok: true });
  });

  it("refuses a blocked player without writing", async () => {
    requireOnboardedUser.mockResolvedValue({
      id: ME,
      blockedAt: new Date("2026-10-15T09:00:00Z"),
    });

    await expect(sendMessage(JOIN, "hi")).resolves.toEqual({
      ok: false,
      message:
        "Your account is blocked pending a review. You can't create offers, join requests or messages until an admin makes a decision.",
    });
    expect(messageCreate).not.toHaveBeenCalled();
  });

  it("refuses once the message rate limit is hit", async () => {
    checkRateLimit.mockResolvedValue({
      ok: false,
      message: "You're sending messages too quickly. Wait a few minutes.",
    });

    await expect(sendMessage(JOIN, "hi")).resolves.toEqual({
      ok: false,
      message: "You're sending messages too quickly. Wait a few minutes.",
    });
    expect(checkRateLimit).toHaveBeenCalledWith(ME, "MESSAGE");
    expect(messageCreate).not.toHaveBeenCalled();
  });

  it("sends as the join's player, and notifies the author", async () => {
    await expect(sendMessage(JOIN, "See you at 6?")).resolves.toEqual({
      ok: true,
      sentMessage: {
        id: MESSAGE,
        type: "TEXT",
        content: "See you at 6?",
        senderId: ME,
        createdAt: createdAt.toISOString(),
      },
    });
    expect(messageCreate).toHaveBeenCalledWith({
      data: { offerJoinId: JOIN, senderId: ME, content: "See you at 6?" },
      select: { id: true, content: true, senderId: true, createdAt: true },
    });
    expect(notify).toHaveBeenCalledWith(AUTHOR, {
      kind: "NEW_MESSAGE",
      offerId: OFFER,
      offerJoinId: JOIN,
    });
  });

  it("sends as the offer's author, and notifies the player", async () => {
    requireOnboardedUser.mockResolvedValue({ id: AUTHOR });

    await expect(
      sendMessage(JOIN, "Sure, see you then"),
    ).resolves.toMatchObject({ ok: true });
    expect(messageCreate).toHaveBeenCalled();
    expect(notify).toHaveBeenCalledWith(ME, {
      kind: "NEW_MESSAGE",
      offerId: OFFER,
      offerJoinId: JOIN,
    });
  });

  it("trims the message before writing it", async () => {
    await sendMessage(JOIN, "  See you at 6?  ");

    expect(messageCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { offerJoinId: JOIN, senderId: ME, content: "See you at 6?" },
      }),
    );
  });

  it.each([undefined, "", "not-a-uuid", 42])(
    "treats a bad join id %j as a missing thread",
    async (joinId) => {
      await expect(sendMessage(joinId, "hi")).resolves.toEqual({
        ok: false,
        message: "This conversation doesn't exist.",
      });
      expect(joinFindUnique).not.toHaveBeenCalled();
      expect(messageCreate).not.toHaveBeenCalled();
    },
  );

  it.each(["", "   "])("refuses an empty message %j", async (content) => {
    await expect(sendMessage(JOIN, content)).resolves.toEqual({
      ok: false,
      message: "Write a message.",
    });
    expect(messageCreate).not.toHaveBeenCalled();
  });

  it("refuses a message over the length limit", async () => {
    await expect(sendMessage(JOIN, "a".repeat(2001))).resolves.toEqual({
      ok: false,
      message: "Keep messages under 2000 characters.",
    });
    expect(messageCreate).not.toHaveBeenCalled();
  });

  it("refuses a non-participant as if the thread doesn't exist", async () => {
    requireOnboardedUser.mockResolvedValue({ id: STRANGER });

    await expect(sendMessage(JOIN, "hi")).resolves.toEqual({
      ok: false,
      message: "This conversation doesn't exist.",
    });
    expect(messageCreate).not.toHaveBeenCalled();
  });

  it("refuses a message to a thread that doesn't exist", async () => {
    joinFindUnique.mockResolvedValue(null);

    await expect(sendMessage(JOIN, "hi")).resolves.toEqual({
      ok: false,
      message: "This conversation doesn't exist.",
    });
    expect(messageCreate).not.toHaveBeenCalled();
  });

  it.each(["DECLINED", "WITHDRAWN"] as const)(
    "refuses a message once the join is %s",
    async (status) => {
      joinFindUnique.mockResolvedValue({ ...upcomingJoin, status });

      await expect(sendMessage(JOIN, "hi")).resolves.toEqual({
        ok: false,
        message: "This conversation is read-only now.",
      });
      expect(messageCreate).not.toHaveBeenCalled();
    },
  );

  it("refuses a message more than 7 days after the match", async () => {
    joinFindUnique.mockResolvedValue({
      ...upcomingJoin,
      status: "ACCEPTED",
      offer: {
        authorId: AUTHOR,
        startsAt: new Date(Date.now() - 8 * 86_400_000),
      },
    });

    await expect(sendMessage(JOIN, "hi")).resolves.toEqual({
      ok: false,
      message: "This conversation is read-only now.",
    });
    expect(messageCreate).not.toHaveBeenCalled();
  });
});
