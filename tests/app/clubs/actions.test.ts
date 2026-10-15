import { beforeEach, describe, expect, it, vi } from "vitest";

import { recordOutboundClick } from "@/app/clubs/actions";

// Logging a click never blocks the navigation the browser is already doing
// (task 2.13): the caller doesn't await this, so nothing here may throw,
// whatever the input or the database does.
const CLUB = "11111111-1111-4111-8111-111111111111";
const OFFER = "22222222-2222-4222-8222-222222222222";
const USER = "33333333-3333-4333-8333-333333333333";

const { getCurrentUser, create } = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  create: vi.fn(),
}));

vi.mock("@/lib/auth/require-user", () => ({ getCurrentUser }));
vi.mock("@/lib/db", () => ({ db: { outboundClick: { create } } }));

describe("recordOutboundClick", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentUser.mockResolvedValue(null);
    create.mockResolvedValue({});
  });

  it("logs a URL click from a guest, with no user attached", async () => {
    await recordOutboundClick({ clubId: CLUB, target: "URL" });

    expect(create).toHaveBeenCalledWith({
      data: { clubId: CLUB, target: "URL", userId: null },
    });
  });

  it("attaches the signed-in viewer", async () => {
    getCurrentUser.mockResolvedValue({ id: USER });

    await recordOutboundClick({ clubId: CLUB, target: "PHONE" });

    expect(create).toHaveBeenCalledWith({
      data: { clubId: CLUB, target: "PHONE", userId: USER },
    });
  });

  it("carries the offer id when the click happened on an offer's page", async () => {
    await recordOutboundClick({ clubId: CLUB, target: "URL", offerId: OFFER });

    expect(create).toHaveBeenCalledWith({
      data: { clubId: CLUB, target: "URL", offerId: OFFER, userId: null },
    });
  });

  it.each([
    [{ clubId: "not-a-uuid", target: "URL" }],
    [{ clubId: CLUB, target: "EMAIL" }],
    [{ clubId: CLUB }],
    [null],
    ["nope"],
  ])("ignores bad input %j without writing", async (input) => {
    await expect(recordOutboundClick(input)).resolves.toBeUndefined();
    expect(create).not.toHaveBeenCalled();
  });

  it("swallows a database error instead of throwing", async () => {
    create.mockRejectedValue(new Error("connection lost"));

    await expect(
      recordOutboundClick({ clubId: CLUB, target: "URL" }),
    ).resolves.toBeUndefined();
  });
});
