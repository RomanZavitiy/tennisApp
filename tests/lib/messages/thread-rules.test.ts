import { describe, expect, it } from "vitest";

import {
  canWriteToThread,
  isJoinThreadParticipant,
} from "@/lib/messages/thread-rules";

const AUTHOR = "author-id";
const PLAYER = "player-id";
const STRANGER = "stranger-id";
const JOIN = { userId: PLAYER, offer: { authorId: AUTHOR } };

describe("isJoinThreadParticipant", () => {
  it.each([PLAYER, AUTHOR])("lets %s in", (userId) => {
    expect(isJoinThreadParticipant(JOIN, userId)).toBe(true);
  });

  it("keeps a stranger out", () => {
    expect(isJoinThreadParticipant(JOIN, STRANGER)).toBe(false);
  });
});

const STARTS_AT = new Date("2026-10-11T10:00:00Z");
const SEVEN_DAYS_MS = 7 * 86_400_000;

describe("canWriteToThread", () => {
  it.each(["REQUESTED", "ACCEPTED"] as const)(
    "writes while %s and well before the match",
    (status) => {
      expect(
        canWriteToThread(
          { status },
          { startsAt: STARTS_AT },
          new Date("2026-10-10T10:00:00Z"),
        ),
      ).toBe(true);
    },
  );

  it.each(["DECLINED", "WITHDRAWN"] as const)(
    "never writes once %s",
    (status) => {
      expect(
        canWriteToThread({ status }, { startsAt: STARTS_AT }, STARTS_AT),
      ).toBe(false);
    },
  );

  it("is still writable exactly 7 days after the match", () => {
    const now = new Date(STARTS_AT.getTime() + SEVEN_DAYS_MS);
    expect(
      canWriteToThread({ status: "ACCEPTED" }, { startsAt: STARTS_AT }, now),
    ).toBe(true);
  });

  it("goes read-only just after 7 days", () => {
    const now = new Date(STARTS_AT.getTime() + SEVEN_DAYS_MS + 1);
    expect(
      canWriteToThread({ status: "ACCEPTED" }, { startsAt: STARTS_AT }, now),
    ).toBe(false);
  });
});
