import { beforeEach, describe, expect, it, vi } from "vitest";

import { dismissOffer, undismissOffer } from "@/lib/offers/dismissals/actions";

// Session and database are replaced: what's under test is who may dismiss,
// which write happens, and that dismissing/undismissing twice is a no-op.
const ME = "11111111-1111-4111-8111-111111111111";
const OFFER = "44444444-4444-4444-8444-444444444444";

const {
  requireOnboardedUser,
  offerFindUnique,
  dismissalCreateMany,
  dismissalDeleteMany,
  revalidatePath,
} = vi.hoisted(() => ({
  requireOnboardedUser: vi.fn(),
  offerFindUnique: vi.fn(),
  dismissalCreateMany: vi.fn(),
  dismissalDeleteMany: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth/require-onboarded-user", () => ({ requireOnboardedUser }));
vi.mock("@/lib/db", () => ({
  db: {
    sparringOffer: { findUnique: offerFindUnique },
    offerDismissal: {
      createMany: dismissalCreateMany,
      deleteMany: dismissalDeleteMany,
    },
  },
}));
vi.mock("next/cache", () => ({ revalidatePath }));

beforeEach(() => {
  vi.clearAllMocks();
  requireOnboardedUser.mockResolvedValue({ id: ME });
  offerFindUnique.mockResolvedValue({ id: OFFER });
});

describe("dismissOffer", () => {
  it("rejects a malformed offer id", async () => {
    const result = await dismissOffer("not-a-uuid");

    expect(result).toEqual({ ok: false, message: "This offer doesn't exist." });
    expect(dismissalCreateMany).not.toHaveBeenCalled();
  });

  it("refuses an offer that doesn't exist", async () => {
    offerFindUnique.mockResolvedValue(null);

    const result = await dismissOffer(OFFER);

    expect(result).toEqual({ ok: false, message: "This offer doesn't exist." });
    expect(dismissalCreateMany).not.toHaveBeenCalled();
  });

  it("hides the offer for the signed-in player", async () => {
    const result = await dismissOffer(OFFER);

    expect(result).toEqual({ ok: true });
    expect(dismissalCreateMany).toHaveBeenCalledWith({
      data: [{ userId: ME, offerId: OFFER }],
      skipDuplicates: true,
    });
    expect(revalidatePath).toHaveBeenCalledWith("/offers");
  });

  it("dismissing twice is a no-op, not an error", async () => {
    const first = await dismissOffer(OFFER);
    const second = await dismissOffer(OFFER);

    expect(first).toEqual({ ok: true });
    expect(second).toEqual({ ok: true });
    expect(dismissalCreateMany).toHaveBeenCalledTimes(2);
  });

  it("has no ownership check: a player may dismiss their own offer", async () => {
    // requireOnboardedUser() returns the same id as the offer's author here
    // on purpose — dismissing your own offer is allowed, not special-cased.
    const result = await dismissOffer(OFFER);

    expect(result).toEqual({ ok: true });
  });
});

describe("undismissOffer", () => {
  it("rejects a malformed offer id", async () => {
    const result = await undismissOffer("not-a-uuid");

    expect(result).toEqual({ ok: false, message: "This offer doesn't exist." });
    expect(dismissalDeleteMany).not.toHaveBeenCalled();
  });

  it("unhides the offer for the signed-in player", async () => {
    const result = await undismissOffer(OFFER);

    expect(result).toEqual({ ok: true });
    expect(dismissalDeleteMany).toHaveBeenCalledWith({
      where: { userId: ME, offerId: OFFER },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/offers");
  });

  it("undismissing an offer that was never hidden is a no-op", async () => {
    dismissalDeleteMany.mockResolvedValue({ count: 0 });

    const result = await undismissOffer(OFFER);

    expect(result).toEqual({ ok: true });
  });
});
