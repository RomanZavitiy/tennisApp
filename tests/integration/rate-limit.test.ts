import { randomUUID } from "node:crypto";

import { describe, expect, it } from "vitest";

import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit/check-rate-limit";

// checkRateLimit is one upsert per call. Whether N+1 calls landing together
// count as N+1 -- no lost update, no unique-violation from two "first"
// inserts -- depends on Postgres, not on anything a mock can show.

describe("checkRateLimit", () => {
  it.each([
    // [action, its limit in lib/rate-limit/check-rate-limit.ts]
    ["CLUB_SUBMISSION", 3],
    ["MAGIC_LINK", 5],
    ["NEW_OFFER", 10],
  ] as const)(
    "%s: limit + 1 simultaneous calls give exactly one refusal",
    async (action, limit) => {
      const subject = randomUUID();
      const now = new Date();

      const outcomes = await Promise.all(
        Array.from({ length: limit + 1 }, () =>
          checkRateLimit(subject, action, now),
        ),
      );

      expect(outcomes.filter((outcome) => !outcome.ok)).toHaveLength(1);
      const rows = await db.rateLimitCounter.findMany({ where: { subject } });
      expect(rows).toHaveLength(1);
      expect(rows[0]?.count).toBe(limit + 1);
    },
  );

  it("counts each subject and each window on its own", async () => {
    const [first, second] = [randomUUID(), randomUUID()];
    const now = new Date();
    const nextDay = new Date(now.getTime() + 24 * 3_600_000);

    for (let i = 0; i < 3; i++) {
      expect(await checkRateLimit(first, "CLUB_SUBMISSION", now)).toEqual({
        ok: true,
      });
    }
    expect(await checkRateLimit(first, "CLUB_SUBMISSION", now)).toEqual({
      ok: false,
    });
    expect(await checkRateLimit(second, "CLUB_SUBMISSION", now)).toEqual({
      ok: true,
    });
    expect(await checkRateLimit(first, "CLUB_SUBMISSION", nextDay)).toEqual({
      ok: true,
    });
  });
});
