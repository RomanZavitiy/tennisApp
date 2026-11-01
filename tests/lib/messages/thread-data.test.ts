import { beforeEach, describe, expect, it, vi } from "vitest";

import { getClubThread } from "@/lib/messages/thread-data";

// Only getClubThread is under test here: getJoinThread's own rules are
// already covered through sendMessage's tests
// (tests/app/offers/send-message.test.ts) and thread-rules.test.ts.
const VIEWER = "11111111-1111-4111-8111-111111111111";
const SENDER = "22222222-2222-4222-8222-222222222222";
const CLUB = "44444444-4444-4444-8444-444444444444";

const { followFindUnique, messageFindMany } = vi.hoisted(() => ({
  followFindUnique: vi.fn(),
  messageFindMany: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    clubFollow: { findUnique: followFindUnique },
    message: { findMany: messageFindMany },
  },
}));

describe("getClubThread", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null for a non-follower — the thread looks missing", async () => {
    followFindUnique.mockResolvedValue(null);

    await expect(getClubThread(CLUB, VIEWER)).resolves.toBeNull();
    expect(messageFindMany).not.toHaveBeenCalled();
  });

  it("returns a follower's messages with first-name-and-initial senders", async () => {
    followFindUnique.mockResolvedValue({ id: "follow-1" });
    const createdAt = new Date("2026-11-01T10:00:00Z");
    messageFindMany.mockResolvedValue([
      {
        id: "msg-1",
        type: "TEXT",
        content: "Anyone free Saturday?",
        senderId: SENDER,
        createdAt,
        sender: { name: "Jan Kowalski" },
      },
    ]);

    const thread = await getClubThread(CLUB, VIEWER);

    expect(thread).toEqual({
      messages: [
        {
          id: "msg-1",
          type: "TEXT",
          content: "Anyone free Saturday?",
          senderId: SENDER,
          createdAt,
        },
      ],
      senderNames: { [SENDER]: "Jan K." },
      writable: true,
    });
  });
});
