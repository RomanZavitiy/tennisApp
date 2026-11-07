import { beforeEach, describe, expect, it, vi } from "vitest";

import { getCoaches, getCoachesForClub } from "@/lib/coaches/get-coaches";

// The database is replaced: what's under test is which coaches the query
// asks for, how they're filtered, and how the club join comes through.
const { findMany } = vi.hoisted(() => ({ findMany: vi.fn() }));
vi.mock("@/lib/db", () => ({
  db: { coach: { findMany } },
}));

function row(
  id: string,
  overrides: {
    name?: string;
    district?: string | null;
    levels?: string[];
    clubs?: { id: string; name: string }[];
  } = {},
) {
  return {
    id,
    slug: `coach-${id}`,
    name: overrides.name ?? "Jan Kowalski",
    bio: null,
    district: overrides.district === undefined ? null : overrides.district,
    levels: overrides.levels ?? ["BEGINNER"],
    languages: ["PL"],
    priceInfo: null,
    phone: null,
    websiteUrl: null,
    verifiedAt: new Date("2026-10-01T00:00:00Z"),
    clubs: overrides.clubs ?? [],
  };
}

describe("getCoaches", () => {
  beforeEach(() => {
    findMany.mockReset();
    findMany.mockResolvedValue([]);
  });

  it("asks for every coach, ordered by name, with no filters", async () => {
    await getCoaches();

    const query = findMany.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(query.where).toEqual({});
    expect(query.orderBy).toEqual({ name: "asc" });
  });

  it("narrows the query by district", async () => {
    await getCoaches({ district: "KROWODRZA" as never });

    const query = findMany.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(query.where).toEqual({ district: "KROWODRZA" });
  });

  it("narrows the query by level", async () => {
    await getCoaches({ level: "KIDS" as never });

    const query = findMany.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(query.where).toEqual({ levels: { has: "KIDS" } });
  });

  it("combines district and level filters", async () => {
    await getCoaches({ district: "KROWODRZA", level: "KIDS" } as never);

    const query = findMany.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(query.where).toEqual({
      district: "KROWODRZA",
      levels: { has: "KIDS" },
    });
  });

  it("returns rows in the order the database gives them", async () => {
    findMany.mockResolvedValue([
      row("1", { name: "Anna" }),
      row("2", { name: "Jan" }),
    ]);

    const coaches = await getCoaches();

    expect(coaches.map((coach) => coach.name)).toEqual(["Anna", "Jan"]);
  });

  it("carries the joined clubs through to each coach", async () => {
    findMany.mockResolvedValue([
      row("1", { clubs: [{ id: "club-1", name: "KKS Olsza" }] }),
    ]);

    const coaches = await getCoaches();

    expect(coaches[0]?.clubs).toEqual([{ id: "club-1", name: "KKS Olsza" }]);
  });
});

describe("getCoachesForClub", () => {
  beforeEach(() => {
    findMany.mockReset();
    findMany.mockResolvedValue([]);
  });

  it("asks only for coaches teaching at the given club", async () => {
    await getCoachesForClub("club-1");

    const query = findMany.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(query.where).toEqual({ clubs: { some: { id: "club-1" } } });
    expect(query.orderBy).toEqual({ name: "asc" });
  });

  it("returns name and slug only", async () => {
    findMany.mockResolvedValue([
      { slug: "jan-kowalski", name: "Jan Kowalski" },
    ]);

    const coaches = await getCoachesForClub("club-1");

    expect(coaches).toEqual([{ slug: "jan-kowalski", name: "Jan Kowalski" }]);
  });
});
