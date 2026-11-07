import { describe, expect, it } from "vitest";

import {
  isPlayingSoon,
  PLAY_TODAY_WINDOW_HOURS,
} from "@/lib/offers/play-today";

const NOW = new Date("2026-11-10T12:00:00Z");

describe("isPlayingSoon", () => {
  it("is false for an offer that already started", () => {
    expect(isPlayingSoon(NOW, NOW)).toBe(false);
    expect(isPlayingSoon(new Date(NOW.getTime() - 60_000), NOW)).toBe(false);
  });

  it("is true for an offer starting soon", () => {
    expect(isPlayingSoon(new Date(NOW.getTime() + 3_600_000), NOW)).toBe(true);
  });

  it("is true exactly at the window's edge", () => {
    expect(
      isPlayingSoon(
        new Date(NOW.getTime() + PLAY_TODAY_WINDOW_HOURS * 3_600_000),
        NOW,
      ),
    ).toBe(true);
  });

  it("is false just past the window's edge", () => {
    expect(
      isPlayingSoon(
        new Date(NOW.getTime() + PLAY_TODAY_WINDOW_HOURS * 3_600_000 + 1),
        NOW,
      ),
    ).toBe(false);
  });
});
