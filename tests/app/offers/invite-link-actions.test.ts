import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createInviteLink,
  joinByInviteLink,
  revokeInviteLink,
} from "@/app/offers/[id]/invite-link-actions";

// Session and database are replaced: what's under test is who can turn an
// offer's invite link on or off, and that opening a current link gives a
// free place at once — under a lock, with the usual side effects (slice
// PD3, task PD3.3). The rules themselves are tested in
// tests/lib/offers/invite-link.test.ts.
const OFFER = "44444444-4444-4444-8444-444444444444";
const TOKEN = "abcdefghijklmnopqrstuvwxyz012345";
const OTHER_TOKEN = "zyxwvutsrqponmlkjihgfedcba543210";

const {
  requireOnboardedUser,
  offerFindUnique,
  offerUpdate,
  checkRateLimit,
  isBlockedEitherWay,
  postSystemMessage,
  notify,
  captureEvent,
  recordScheduledMatch,
  tx,
} = vi.hoisted(() => ({
  requireOnboardedUser: vi.fn(),
  offerFindUnique: vi.fn(),
  offerUpdate: vi.fn(),
  checkRateLimit: vi.fn(),
  isBlockedEitherWay: vi.fn(),
  postSystemMessage: vi.fn(),
  notify: vi.fn(),
  captureEvent: vi.fn(),
  recordScheduledMatch: vi.fn(),
  tx: {
    $queryRaw: vi.fn(),
    sparringOffer: { findUnique: vi.fn(), update: vi.fn() },
    offerJoin: { findUnique: vi.fn(), update: vi.fn(), create: vi.fn() },
  },
}));

vi.mock("@/lib/auth/require-onboarded-user", () => ({ requireOnboardedUser }));
vi.mock("@/lib/db", () => ({
  db: {
    sparringOffer: { findUnique: offerFindUnique, update: offerUpdate },
    $transaction: (run: (client: typeof tx) => Promise<unknown>) => run(tx),
  },
}));
vi.mock("@/lib/rate-limit/check-rate-limit", () => ({ checkRateLimit }));
vi.mock("@/lib/moderation/personal-block", () => ({ isBlockedEitherWay }));
vi.mock("@/lib/messages/post-system-message", () => ({
  postSystemMessage,
  THREAD_WELCOME_MESSAGE: "welcome",
}));
vi.mock("@/lib/notifications/notify", () => ({ notify }));
vi.mock("@/lib/analytics/posthog", () => ({ captureEvent }));
vi.mock("@/lib/rating/reliability", () => ({ recordScheduledMatch }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

function lockedOffer(over: Record<string, unknown> = {}) {
  return {
    authorId: "author",
    status: "OPEN",
    format: "DOUBLES",
    hasPartner: false,
    startsAt: new Date(Date.now() + 86_400_000),
    matchGender: "ANY",
    inviteToken: TOKEN,
    _count: { joins: 0 },
    ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  requireOnboardedUser.mockResolvedValue({
    id: "player",
    gender: "FEMALE",
    blockedAt: null,
  });
  checkRateLimit.mockResolvedValue({ ok: true });
  isBlockedEitherWay.mockResolvedValue(false);
  tx.sparringOffer.findUnique.mockResolvedValue(lockedOffer());
  tx.offerJoin.findUnique.mockResolvedValue(null);
  tx.offerJoin.create.mockResolvedValue({ id: "join-1" });
  tx.offerJoin.update.mockResolvedValue({ id: "join-old" });
});

describe("createInviteLink / revokeInviteLink", () => {
  it("writes a fresh token on the author's own offer", async () => {
    requireOnboardedUser.mockResolvedValue({ id: "author", blockedAt: null });
    offerFindUnique.mockResolvedValue({ id: OFFER, authorId: "author" });

    expect(await createInviteLink(OFFER)).toEqual({ ok: true });

    const [args] = offerUpdate.mock.calls[0] as [
      { data: { inviteToken: string } },
    ];
    expect(args.data.inviteToken).toMatch(/^[A-Za-z0-9_-]{32}$/);
  });

  it("clears the token when the author turns the link off", async () => {
    requireOnboardedUser.mockResolvedValue({ id: "author", blockedAt: null });
    offerFindUnique.mockResolvedValue({ id: OFFER, authorId: "author" });

    expect(await revokeInviteLink(OFFER)).toEqual({ ok: true });
    expect(offerUpdate).toHaveBeenCalledWith({
      where: { id: OFFER },
      data: { inviteToken: null },
    });
  });

  it("refuses anyone but the author, and a bad id", async () => {
    offerFindUnique.mockResolvedValue({ id: OFFER, authorId: "author" });

    expect(await createInviteLink(OFFER)).toMatchObject({ ok: false });
    expect(await revokeInviteLink(OFFER)).toMatchObject({ ok: false });
    expect(await createInviteLink("nope")).toMatchObject({ ok: false });
    expect(offerUpdate).not.toHaveBeenCalled();
  });
});

describe("joinByInviteLink", () => {
  it("gives a free place at once, under a lock, and tells the author", async () => {
    expect(await joinByInviteLink(OFFER, TOKEN)).toEqual({ ok: true });

    expect(tx.$queryRaw).toHaveBeenCalled();
    expect(tx.offerJoin.create).toHaveBeenCalledWith({
      data: { offerId: OFFER, userId: "player", status: "ACCEPTED" },
      select: { id: true },
    });
    expect(postSystemMessage).toHaveBeenCalledWith(
      { offerJoinId: "join-1" },
      "welcome",
    );
    expect(notify).toHaveBeenCalledWith("author", {
      kind: "INVITE_ACCEPTED",
      offerId: OFFER,
    });
    expect(captureEvent).toHaveBeenCalledWith(
      "invite_link_joined",
      "player",
      {},
    );
  });

  it("marks the game FULL when this was the last place", async () => {
    tx.sparringOffer.findUnique.mockResolvedValue(
      lockedOffer({ _count: { joins: 2 } }),
    );

    await joinByInviteLink(OFFER, TOKEN);

    expect(tx.sparringOffer.update).toHaveBeenCalledWith({
      where: { id: OFFER },
      data: { status: "FULL" },
    });
  });

  it("reuses a waiting request instead of adding a second row", async () => {
    tx.offerJoin.findUnique.mockResolvedValue({
      id: "join-old",
      status: "REQUESTED",
    });

    expect(await joinByInviteLink(OFFER, TOKEN)).toEqual({ ok: true });
    expect(tx.offerJoin.update).toHaveBeenCalledWith({
      where: { id: "join-old" },
      data: { status: "ACCEPTED" },
      select: { id: true },
    });
    expect(tx.offerJoin.create).not.toHaveBeenCalled();
    expect(postSystemMessage).not.toHaveBeenCalled();
  });

  it("records a scheduled match for a singles game", async () => {
    tx.sparringOffer.findUnique.mockResolvedValue(
      lockedOffer({ format: "SINGLES" }),
    );

    await joinByInviteLink(OFFER, TOKEN);

    expect(recordScheduledMatch).toHaveBeenCalledWith(tx, ["author", "player"]);
  });

  it("refuses an old or turned-off link without writing anything", async () => {
    expect(await joinByInviteLink(OFFER, OTHER_TOKEN)).toMatchObject({
      ok: false,
    });
    tx.sparringOffer.findUnique.mockResolvedValue(
      lockedOffer({ inviteToken: null }),
    );
    expect(await joinByInviteLink(OFFER, TOKEN)).toMatchObject({ ok: false });
    expect(tx.offerJoin.create).not.toHaveBeenCalled();
    expect(notify).not.toHaveBeenCalled();
  });

  it("refuses a malformed token before touching the database", async () => {
    expect(await joinByInviteLink(OFFER, "x")).toMatchObject({ ok: false });
    expect(checkRateLimit).not.toHaveBeenCalled();
  });

  it("refuses a full game and a men's game for a woman", async () => {
    tx.sparringOffer.findUnique.mockResolvedValue(
      lockedOffer({ _count: { joins: 3 } }),
    );
    expect(await joinByInviteLink(OFFER, TOKEN)).toMatchObject({ ok: false });

    tx.sparringOffer.findUnique.mockResolvedValue(
      lockedOffer({ matchGender: "MEN" }),
    );
    expect(await joinByInviteLink(OFFER, TOKEN)).toMatchObject({ ok: false });
    expect(tx.offerJoin.create).not.toHaveBeenCalled();
  });

  it("is rate-limited like asking to join", async () => {
    checkRateLimit.mockResolvedValue({ ok: false });

    expect(await joinByInviteLink(OFFER, TOKEN)).toMatchObject({ ok: false });
    expect(checkRateLimit).toHaveBeenCalledWith("player", "JOIN_REQUEST");
    expect(tx.$queryRaw).not.toHaveBeenCalled();
  });
});
