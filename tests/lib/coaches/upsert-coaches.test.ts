import { describe, expect, it, vi } from "vitest";

import type { Prisma } from "@/lib/generated/prisma/client";
import { upsertCoaches } from "@/lib/coaches/upsert-coaches";
import type { CoachRecord } from "@/lib/validation/coach";

// Only the two calls upsertCoaches actually makes; cast past the rest of
// Prisma.TransactionClient's surface, which this function never touches —
// same pattern as tests/lib/rating/apply-elo.test.ts's fakeTx.
function fakeTx(clubs: { id: string; slug: string }[]) {
  const findMany = vi.fn().mockResolvedValue(clubs);
  const upsert = vi.fn().mockResolvedValue(undefined);
  const tx = {
    club: { findMany },
    coach: { upsert },
  } as unknown as Prisma.TransactionClient;
  return { tx, findMany, upsert };
}

const coach: CoachRecord = {
  slug: "jan-kowalski",
  name: "Jan Kowalski",
  bio: "Coaching since 2015.",
  district: "STARE_MIASTO",
  levels: ["BEGINNER", "KIDS"],
  languages: ["PL", "EN"],
  priceInfo: "150 zł/h",
  phone: "+48 600 000 000",
  websiteUrl: "https://example.com/",
  verifiedAt: "2026-10-01",
  clubSlugs: ["kks-olsza"],
  source: "https://example.com/about",
};

describe("upsertCoaches", () => {
  it("upserts by slug and connects known clubs", async () => {
    const { tx, upsert } = fakeTx([{ id: "club-1", slug: "kks-olsza" }]);

    await upsertCoaches(tx, [coach]);

    const data = {
      slug: "jan-kowalski",
      name: "Jan Kowalski",
      bio: "Coaching since 2015.",
      district: "STARE_MIASTO",
      levels: ["BEGINNER", "KIDS"],
      languages: ["PL", "EN"],
      priceInfo: "150 zł/h",
      phone: "+48 600 000 000",
      websiteUrl: "https://example.com/",
      verifiedAt: new Date("2026-10-01T00:00:00Z"),
    };
    expect(upsert).toHaveBeenCalledWith({
      where: { slug: "jan-kowalski" },
      create: { ...data, clubs: { connect: [{ id: "club-1" }] } },
      update: { ...data, clubs: { set: [{ id: "club-1" }] } },
    });
  });

  it("is idempotent: re-running with the same data upserts the same row again", async () => {
    const { tx, upsert } = fakeTx([{ id: "club-1", slug: "kks-olsza" }]);

    await upsertCoaches(tx, [coach]);
    await upsertCoaches(tx, [coach]);

    expect(upsert).toHaveBeenCalledTimes(2);
    expect(upsert.mock.calls[0]).toEqual(upsert.mock.calls[1]);
  });

  it("rejects a club slug that doesn't exist, before writing anything", async () => {
    const { tx, upsert } = fakeTx([]); // no clubs loaded

    await expect(upsertCoaches(tx, [coach])).rejects.toThrow(
      "Unknown club slug(s) in coach data: kks-olsza",
    );
    expect(upsert).not.toHaveBeenCalled();
  });

  it("replaces club links rather than appending them", async () => {
    const { tx, upsert } = fakeTx([
      { id: "club-1", slug: "kks-olsza" },
      { id: "club-2", slug: "baszta" },
    ]);
    const movedCoach = { ...coach, clubSlugs: ["baszta"] };

    await upsertCoaches(tx, [movedCoach]);

    const call = upsert.mock.calls[0]?.[0] as { update: { clubs: unknown } };
    expect(call.update.clubs).toEqual({ set: [{ id: "club-2" }] });
  });
});
