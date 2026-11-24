import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  feedbackDeadline,
  FEEDBACK_WINDOW_DAYS,
  getGivenFeedback,
  isFeedbackWindowOpen,
  submitDoublesFeedback,
  submitMatchFeedback,
} from "@/lib/feedback/match-feedback";

const {
  matchResultFindUnique,
  matchFeedbackFindMany,
  createManyAndReturn,
  userBlockFindFirst,
  doublesResultFindUnique,
} = vi.hoisted(() => ({
  matchResultFindUnique: vi.fn(),
  matchFeedbackFindMany: vi.fn(),
  createManyAndReturn: vi.fn(),
  userBlockFindFirst: vi.fn(),
  doublesResultFindUnique: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    matchResult: { findUnique: matchResultFindUnique },
    doublesResult: { findUnique: doublesResultFindUnique },
    matchFeedback: {
      findMany: matchFeedbackFindMany,
      createManyAndReturn,
    },
    userBlock: { findFirst: userBlockFindFirst },
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

const AUTHOR = "11111111-1111-4111-8111-111111111111";
const PLAYER = "22222222-2222-4222-8222-222222222222";
const OUTSIDER = "33333333-3333-4333-8333-333333333333";
const MATCH_ID = "match-1";
const CONFIRMED_AT = new Date("2026-10-20T10:00:00Z");

describe("feedbackDeadline / isFeedbackWindowOpen", () => {
  it(`is ${String(FEEDBACK_WINDOW_DAYS)} days after confirmation`, () => {
    expect(feedbackDeadline(CONFIRMED_AT)).toEqual(
      new Date(CONFIRMED_AT.getTime() + FEEDBACK_WINDOW_DAYS * 86_400_000),
    );
  });

  it("is open one millisecond inside the window", () => {
    const now = new Date(
      CONFIRMED_AT.getTime() + FEEDBACK_WINDOW_DAYS * 86_400_000 - 1,
    );
    expect(isFeedbackWindowOpen(CONFIRMED_AT, now)).toBe(true);
  });

  it("is closed exactly at the 7-day boundary", () => {
    const now = new Date(
      CONFIRMED_AT.getTime() + FEEDBACK_WINDOW_DAYS * 86_400_000,
    );
    expect(isFeedbackWindowOpen(CONFIRMED_AT, now)).toBe(false);
  });

  it("is closed a day past the window", () => {
    const now = new Date(
      CONFIRMED_AT.getTime() + (FEEDBACK_WINDOW_DAYS + 1) * 86_400_000,
    );
    expect(isFeedbackWindowOpen(CONFIRMED_AT, now)).toBe(false);
  });
});

describe("getGivenFeedback", () => {
  it("returns an empty map without querying for an empty id list", async () => {
    const result = await getGivenFeedback(AUTHOR, []);
    expect(result.size).toBe(0);
    expect(matchFeedbackFindMany).not.toHaveBeenCalled();
  });

  it("keys the result by matchResultId", async () => {
    matchFeedbackFindMany.mockResolvedValue([
      { matchResultId: MATCH_ID, tags: ["PUNCTUAL"], levelSignal: null },
    ]);

    const result = await getGivenFeedback(AUTHOR, [MATCH_ID]);

    expect(result.get(MATCH_ID)).toEqual({
      matchResultId: MATCH_ID,
      tags: ["PUNCTUAL"],
      levelSignal: null,
    });
  });
});

function matchResult(overrides: { status?: string; updatedAt?: Date } = {}) {
  return {
    status: "CONFIRMED",
    updatedAt: CONFIRMED_AT,
    offerJoin: { userId: PLAYER, offer: { authorId: AUTHOR } },
    ...overrides,
  };
}

describe("submitMatchFeedback", () => {
  const NOW_INSIDE_WINDOW = new Date("2026-10-21T10:00:00Z");

  it("refuses a match that doesn't exist", async () => {
    matchResultFindUnique.mockResolvedValue(null);

    const outcome = await submitMatchFeedback(
      MATCH_ID,
      AUTHOR,
      { tags: [], levelSignal: null },
      NOW_INSIDE_WINDOW,
    );

    expect(outcome).toEqual({ ok: false, refusal: "MATCH_NOT_FOUND" });
  });

  it("refuses a result that isn't CONFIRMED yet", async () => {
    matchResultFindUnique.mockResolvedValue(matchResult({ status: "PENDING" }));

    const outcome = await submitMatchFeedback(
      MATCH_ID,
      AUTHOR,
      { tags: [], levelSignal: null },
      NOW_INSIDE_WINDOW,
    );

    expect(outcome).toEqual({ ok: false, refusal: "NOT_CONFIRMED" });
  });

  it("refuses someone who wasn't a party to the match", async () => {
    matchResultFindUnique.mockResolvedValue(matchResult());

    const outcome = await submitMatchFeedback(
      MATCH_ID,
      OUTSIDER,
      { tags: [], levelSignal: null },
      NOW_INSIDE_WINDOW,
    );

    expect(outcome).toEqual({ ok: false, refusal: "NOT_PARTICIPANT" });
  });

  it("refuses once the 7-day window has closed", async () => {
    matchResultFindUnique.mockResolvedValue(matchResult());
    const now = new Date(
      CONFIRMED_AT.getTime() + (FEEDBACK_WINDOW_DAYS + 1) * 86_400_000,
    );

    const outcome = await submitMatchFeedback(
      MATCH_ID,
      AUTHOR,
      { tags: [], levelSignal: null },
      now,
    );

    expect(outcome).toEqual({ ok: false, refusal: "WINDOW_CLOSED" });
  });

  it("refuses between players who blocked each other", async () => {
    matchResultFindUnique.mockResolvedValue(matchResult());
    userBlockFindFirst.mockResolvedValue({ id: "block-1" });

    const outcome = await submitMatchFeedback(
      MATCH_ID,
      AUTHOR,
      { tags: [], levelSignal: null },
      NOW_INSIDE_WINDOW,
    );

    expect(outcome).toEqual({ ok: false, refusal: "BLOCKED" });
  });

  it("refuses a second submission for the same match", async () => {
    matchResultFindUnique.mockResolvedValue(matchResult());
    userBlockFindFirst.mockResolvedValue(null);
    createManyAndReturn.mockResolvedValue([]);

    const outcome = await submitMatchFeedback(
      MATCH_ID,
      AUTHOR,
      { tags: [], levelSignal: null },
      NOW_INSIDE_WINDOW,
    );

    expect(outcome).toEqual({ ok: false, refusal: "ALREADY_GIVEN" });
  });

  it("writes the giver's feedback against the other party, within the window", async () => {
    matchResultFindUnique.mockResolvedValue(matchResult());
    userBlockFindFirst.mockResolvedValue(null);
    createManyAndReturn.mockResolvedValue([{ id: "feedback-1" }]);

    const outcome = await submitMatchFeedback(
      MATCH_ID,
      AUTHOR,
      { tags: ["PUNCTUAL", "GOOD_GAME"], levelSignal: "HIGHER" },
      NOW_INSIDE_WINDOW,
    );

    expect(outcome).toEqual({ ok: true });
    expect(createManyAndReturn).toHaveBeenCalledWith({
      data: [
        {
          matchResultId: MATCH_ID,
          giverId: AUTHOR,
          receiverId: PLAYER,
          tags: ["PUNCTUAL", "GOOD_GAME"],
          levelSignal: "HIGHER",
        },
      ],
      select: { id: true },
      skipDuplicates: true,
    });
  });
});

describe("submitDoublesFeedback (slice PD4)", () => {
  const P2 = "44444444-4444-4444-8444-444444444444";
  const NOW = new Date(CONFIRMED_AT.getTime() + 86_400_000);
  const confirmedGame = {
    status: "CONFIRMED",
    updatedAt: CONFIRMED_AT,
    offer: { authorId: AUTHOR, joins: [{ userId: PLAYER }, { userId: P2 }] },
  };

  beforeEach(() => {
    doublesResultFindUnique.mockResolvedValue(confirmedGame);
    userBlockFindFirst.mockResolvedValue(null);
    createManyAndReturn.mockResolvedValue([{ id: "f1" }]);
  });

  it("saves a tags-only row for one other player of the game", async () => {
    const outcome = await submitDoublesFeedback(
      "d1",
      PLAYER,
      P2,
      ["GOOD_GAME"],
      NOW,
    );

    expect(outcome).toEqual({ ok: true });
    expect(createManyAndReturn).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [
          {
            doublesResultId: "d1",
            giverId: PLAYER,
            receiverId: P2,
            tags: ["GOOD_GAME"],
            levelSignal: null,
          },
        ],
      }),
    );
  });

  it("refuses rating yourself or someone who wasn't in the game", async () => {
    expect(await submitDoublesFeedback("d1", PLAYER, PLAYER, [], NOW)).toEqual({
      ok: false,
      refusal: "NOT_PARTICIPANT",
    });
    expect(
      await submitDoublesFeedback("d1", PLAYER, OUTSIDER, [], NOW),
    ).toEqual({ ok: false, refusal: "NOT_PARTICIPANT" });
  });

  it("refuses before confirmation and after the 7-day window", async () => {
    doublesResultFindUnique.mockResolvedValueOnce({
      ...confirmedGame,
      status: "PENDING",
    });
    expect(await submitDoublesFeedback("d1", PLAYER, P2, [], NOW)).toEqual({
      ok: false,
      refusal: "NOT_CONFIRMED",
    });

    const late = new Date(CONFIRMED_AT.getTime() + 8 * 86_400_000);
    expect(await submitDoublesFeedback("d1", PLAYER, P2, [], late)).toEqual({
      ok: false,
      refusal: "WINDOW_CLOSED",
    });
  });

  it("refuses a second rating of the same player", async () => {
    createManyAndReturn.mockResolvedValue([]);

    expect(await submitDoublesFeedback("d1", PLAYER, P2, [], NOW)).toEqual({
      ok: false,
      refusal: "ALREADY_GIVEN",
    });
  });
});
