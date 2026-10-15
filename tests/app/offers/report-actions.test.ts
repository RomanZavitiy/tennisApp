import { beforeEach, describe, expect, it, vi } from "vitest";

import { reportMessage, reportOffer } from "@/app/offers/[id]/report-actions";

const ME = "11111111-1111-4111-8111-111111111111";
const AUTHOR = "22222222-2222-4222-8222-222222222222";
const STRANGER = "33333333-3333-4333-8333-333333333333";
const OFFER = "44444444-4444-4444-8444-444444444444";
const JOIN = "55555555-5555-4555-8555-555555555555";
const MESSAGE = "66666666-6666-4666-8666-666666666666";

const {
  requireOnboardedUser,
  offerFindUnique,
  joinFindUnique,
  messageFindUnique,
  createReport,
} = vi.hoisted(() => ({
  requireOnboardedUser: vi.fn(),
  offerFindUnique: vi.fn(),
  joinFindUnique: vi.fn(),
  messageFindUnique: vi.fn(),
  createReport: vi.fn(),
}));

vi.mock("@/lib/auth/require-onboarded-user", () => ({ requireOnboardedUser }));
vi.mock("@/lib/db", () => ({
  db: {
    sparringOffer: { findUnique: offerFindUnique },
    offerJoin: { findUnique: joinFindUnique },
    message: { findUnique: messageFindUnique },
  },
}));
vi.mock("@/lib/moderation/create-report", () => ({ createReport }));

const input = { reason: "ABUSIVE" };

describe("reportOffer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireOnboardedUser.mockResolvedValue({ id: ME });
    offerFindUnique.mockResolvedValue({ authorId: AUTHOR });
    createReport.mockResolvedValue({ ok: true });
  });

  it("resolves the target from the offer's author, not the request", async () => {
    await reportOffer(OFFER, input);

    expect(createReport).toHaveBeenCalledWith(
      expect.objectContaining({
        reporterId: ME,
        targetUserId: AUTHOR,
        offerId: OFFER,
        input: { reason: "ABUSIVE", comment: undefined },
      }),
    );
  });

  it("treats a missing offer as not found, without reporting", async () => {
    offerFindUnique.mockResolvedValue(null);

    await expect(reportOffer(OFFER, input)).resolves.toEqual({
      ok: false,
      message: "This offer doesn't exist.",
    });
    expect(createReport).not.toHaveBeenCalled();
  });

  it("rejects a bad offer id without looking anything up", async () => {
    await expect(reportOffer("not-a-uuid", input)).resolves.toEqual({
      ok: false,
      message: "This offer doesn't exist.",
    });
    expect(offerFindUnique).not.toHaveBeenCalled();
  });

  it("rejects an invalid reason without reporting", async () => {
    await expect(reportOffer(OFFER, { reason: "MADE_UP" })).resolves.toEqual({
      ok: false,
      message: "Choose a reason.",
    });
    expect(createReport).not.toHaveBeenCalled();
  });
});

describe("reportMessage", () => {
  const upcomingJoin = { userId: ME, offer: { authorId: AUTHOR } };

  beforeEach(() => {
    vi.clearAllMocks();
    requireOnboardedUser.mockResolvedValue({ id: ME });
    joinFindUnique.mockResolvedValue(upcomingJoin);
    messageFindUnique.mockResolvedValue({
      offerJoinId: JOIN,
      type: "TEXT",
      senderId: AUTHOR,
    });
    createReport.mockResolvedValue({ ok: true });
  });

  it("resolves the target from the message's sender", async () => {
    await reportMessage(JOIN, MESSAGE, input);

    expect(createReport).toHaveBeenCalledWith(
      expect.objectContaining({
        reporterId: ME,
        targetUserId: AUTHOR,
        messageId: MESSAGE,
        input: { reason: "ABUSIVE", comment: undefined },
      }),
    );
  });

  it("treats someone else's thread as not found", async () => {
    requireOnboardedUser.mockResolvedValue({ id: STRANGER });

    await expect(reportMessage(JOIN, MESSAGE, input)).resolves.toEqual({
      ok: false,
      message: "This conversation doesn't exist.",
    });
    expect(createReport).not.toHaveBeenCalled();
  });

  it("refuses a message that isn't in this thread", async () => {
    messageFindUnique.mockResolvedValue({
      offerJoinId: "some-other-join",
      type: "TEXT",
      senderId: AUTHOR,
    });

    await expect(reportMessage(JOIN, MESSAGE, input)).resolves.toEqual({
      ok: false,
      message: "This message doesn't exist.",
    });
    expect(createReport).not.toHaveBeenCalled();
  });

  it("refuses a system message", async () => {
    messageFindUnique.mockResolvedValue({
      offerJoinId: JOIN,
      type: "SYSTEM",
      senderId: null,
    });

    await expect(reportMessage(JOIN, MESSAGE, input)).resolves.toEqual({
      ok: false,
      message: "This message doesn't exist.",
    });
    expect(createReport).not.toHaveBeenCalled();
  });
});
