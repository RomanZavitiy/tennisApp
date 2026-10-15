import { createFormatter } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { formatCheckedDate, getClub } from "@/lib/clubs/club-details";
import { IndoorCourts, Surface } from "@/lib/generated/prisma/enums";
import en from "@/messages/en.json";
import pl from "@/messages/pl.json";

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

describe("labels (task 1.20)", () => {
  it("has an EN and PL label for every surface and indoor value", () => {
    for (const messages of [en, pl]) {
      expect(Object.keys(messages.Surface).sort()).toEqual(
        Object.values(Surface).sort(),
      );
      expect(Object.keys(messages.IndoorCourts).sort()).toEqual(
        Object.values(IndoorCourts).sort(),
      );
    }
  });
});

describe("formatCheckedDate", () => {
  it("shows the stored date, whatever the server's time zone", () => {
    const format = createFormatter({ locale: "en", timeZone: "Europe/Warsaw" });
    expect(formatCheckedDate(format, new Date("2026-10-09T00:00:00Z"))).toBe(
      "October 9, 2026",
    );
  });
});
