import { describe, expect, it } from "vitest";

import { addFavoriteRefusal, MAX_FAVORITES } from "@/lib/players/favorites";

// Slice PD3, task PD3.4: who a player may add to their favourites.
describe("addFavoriteRefusal", () => {
  const base = { userId: "me", favoriteId: "them", blocked: false, count: 0 };

  it("lets a player add someone else", () => {
    expect(addFavoriteRefusal(base)).toBeNull();
  });

  it("refuses yourself", () => {
    expect(addFavoriteRefusal({ ...base, favoriteId: "me" })).toBe("SELF");
  });

  it("refuses a player on either side of a block", () => {
    expect(addFavoriteRefusal({ ...base, blocked: true })).toBe("BLOCKED");
  });

  it("refuses once the list is full", () => {
    expect(
      addFavoriteRefusal({ ...base, count: MAX_FAVORITES - 1 }),
    ).toBeNull();
    expect(addFavoriteRefusal({ ...base, count: MAX_FAVORITES })).toBe(
      "TOO_MANY",
    );
  });
});
