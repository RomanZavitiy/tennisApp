import { describe, expect, it } from "vitest";

import {
  isLateCancellation,
  recordLateCancellation,
} from "@/lib/rating/reliability";

const NOW = new Date("2026-10-20T10:00:00Z");

describe("isLateCancellation", () => {
  it("is not late at exactly the 12h boundary", () => {
    expect(isLateCancellation(new Date("2026-10-20T22:00:00Z"), NOW)).toBe(
      false,
    );
  });

  it("is late one millisecond inside the 12h boundary", () => {
    expect(isLateCancellation(new Date("2026-10-20T21:59:59.999Z"), NOW)).toBe(
      true,
    );
  });

  it("is not late a day before the start", () => {
    expect(isLateCancellation(new Date("2026-10-21T10:00:00Z"), NOW)).toBe(
      false,
    );
  });

  it("is late a minute before the start", () => {
    expect(isLateCancellation(new Date("2026-10-20T10:01:00Z"), NOW)).toBe(
      true,
    );
  });
});

describe("recordLateCancellation", () => {
  it("is a no-op stub", () => {
    expect(() => {
      recordLateCancellation("some-user-id");
    }).not.toThrow();
  });
});
