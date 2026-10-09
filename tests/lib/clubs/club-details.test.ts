import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  formatCheckedDate,
  getClub,
  INDOOR_LABELS,
  SURFACE_LABELS,
} from "@/lib/clubs/club-details";
import { IndoorCourts, Surface } from "@/lib/generated/prisma/enums";

const { findUnique } = vi.hoisted(() => ({ findUnique: vi.fn() }));

vi.mock("@/lib/db", () => ({ db: { club: { findUnique } } }));

const ID = "11111111-1111-4111-8111-111111111111";

describe("getClub", () => {
  beforeEach(() => {
    findUnique.mockReset();
  });

  it("looks the club up by id", async () => {
    findUnique.mockResolvedValue({ id: ID, name: "Olsza" });

    expect(await getClub(ID)).toEqual({ id: ID, name: "Olsza" });
    expect(findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: ID } }),
    );
  });

  it("returns null for an unknown id", async () => {
    findUnique.mockResolvedValue(null);

    expect(await getClub(ID)).toBeNull();
  });

  it("returns null for a non-UUID without asking the database", async () => {
    expect(await getClub("not-a-uuid")).toBeNull();
    expect(findUnique).not.toHaveBeenCalled();
  });
});

describe("labels", () => {
  it("has a label for every surface and indoor value", () => {
    expect(Object.keys(SURFACE_LABELS).sort()).toEqual(
      Object.values(Surface).sort(),
    );
    expect(Object.keys(INDOOR_LABELS).sort()).toEqual(
      Object.values(IndoorCourts).sort(),
    );
  });
});

describe("formatCheckedDate", () => {
  it("shows the stored date, whatever the server's time zone", () => {
    expect(formatCheckedDate(new Date("2026-10-09T00:00:00Z"))).toBe(
      "9 October 2026",
    );
  });
});
