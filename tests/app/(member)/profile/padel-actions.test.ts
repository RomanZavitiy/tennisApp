import { beforeEach, describe, expect, it, vi } from "vitest";

import { updatePadelProfile } from "@/app/(member)/profile/padel/actions";

// Session and database are replaced: what's under test is what gets saved,
// and that a bad request saves nothing.
const ME = "11111111-1111-4111-8111-111111111111";

const { update } = vi.hoisted(() => ({ update: vi.fn() }));

vi.mock("@/lib/auth/require-user", () => ({
  requireUser: () => Promise.resolve({ id: ME, email: undefined }),
}));
vi.mock("@/lib/db", () => ({ db: { user: { update } } }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

describe("updatePadelProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("saves the level and side on the signed-in player's own row", async () => {
    const result = await updatePadelProfile({
      padelLevel: 3.5,
      padelSide: "RIGHT",
      id: "someone-else",
    });

    expect(result).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith({
      where: { id: ME },
      data: { padelLevel: 3.5, padelSide: "RIGHT" },
    });
  });

  it("clears both when the player no longer plays padel", async () => {
    await updatePadelProfile({ padelLevel: null, padelSide: "LEFT" });

    expect(update).toHaveBeenCalledWith({
      where: { id: ME },
      data: { padelLevel: null, padelSide: null },
    });
  });

  it("refuses a level off the scale without saving", async () => {
    const result = await updatePadelProfile({
      padelLevel: 9,
      padelSide: null,
    });

    expect(result.ok).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });
});
