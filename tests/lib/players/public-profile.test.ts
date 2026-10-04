import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getPublicProfile } from "@/lib/players/public-profile";

// The database is replaced. What's under test: the query asks only for
// public columns, and what comes back has an age, never a birth date.
const { findFirst } = vi.hoisted(() => ({ findFirst: vi.fn() }));

vi.mock("@/lib/db", () => ({ db: { user: { findFirst } } }));

const ID = "11111111-1111-4111-8111-111111111111";

describe("getPublicProfile", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-04T10:00:00Z"));
    findFirst.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns public fields with the age instead of the birth date", async () => {
    findFirst.mockResolvedValue({
      id: ID,
      name: "Ola",
      birthDate: new Date("1995-04-12T00:00:00Z"),
      district: "KROWODRZA",
      selfRatedNtrp: 3.5,
      avatarPath: null,
    });

    const profile = await getPublicProfile(ID);

    expect(profile).toEqual({
      id: ID,
      name: "Ola",
      age: 31,
      district: "KROWODRZA",
      selfRatedNtrp: 3.5,
      avatarPath: null,
    });
    expect(profile).not.toHaveProperty("birthDate");
  });

  it("asks the database only for onboarded players and public columns", async () => {
    findFirst.mockResolvedValue(null);

    await getPublicProfile(ID);

    expect(findFirst).toHaveBeenCalledWith({
      where: { id: ID, onboardingCompletedAt: { not: null } },
      select: {
        id: true,
        name: true,
        birthDate: true,
        district: true,
        selfRatedNtrp: true,
        avatarPath: true,
      },
    });
  });

  it("returns null for an unknown or not-yet-onboarded player", async () => {
    findFirst.mockResolvedValue(null);

    await expect(getPublicProfile(ID)).resolves.toBeNull();
  });

  it.each(["abc", "1", "' OR 1=1 --", ""])(
    "returns null for the non-UUID id %j without querying",
    async (id) => {
      await expect(getPublicProfile(id)).resolves.toBeNull();
      expect(findFirst).not.toHaveBeenCalled();
    },
  );
});
