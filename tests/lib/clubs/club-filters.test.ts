import { describe, expect, it } from "vitest";

import {
  type ClubFilters,
  clubsHref,
  clubWhere,
  parseClubFilters,
} from "@/lib/clubs/club-filters";

describe("parseClubFilters", () => {
  it("reads every filter from the URL", () => {
    expect(
      parseClubFilters({ district: "PODGORZE", surface: "CLAY", indoor: "1" }),
    ).toEqual({ district: "PODGORZE", surface: "CLAY", indoor: true });
  });

  it("ignores empty and unknown values", () => {
    expect(
      parseClubFilters({
        district: "",
        surface: "ICE",
        indoor: "yes",
      }),
    ).toEqual({});
  });

  it("takes the first of a repeated parameter", () => {
    expect(parseClubFilters({ surface: ["HARD", "CLAY"] })).toEqual({
      surface: "HARD",
    });
  });
});

describe("clubWhere", () => {
  it("matches every club with no filters", () => {
    expect(clubWhere({})).toEqual({ AND: [] });
  });

  it("narrows by district, surface and covered courts", () => {
    expect(
      clubWhere({ district: "KROWODRZA", surface: "HARD", indoor: true }),
    ).toEqual({
      AND: [
        { district: "KROWODRZA" },
        { surfaces: { has: "HARD" } },
        { indoor: { in: ["PARTIAL", "YEAR_ROUND", "WINTER_BUBBLE"] } },
      ],
    });
  });
});

describe("clubsHref", () => {
  it("leaves out empty filters", () => {
    expect(clubsHref({})).toBe("/");
    expect(clubsHref({ surface: "CLAY", indoor: true })).toBe(
      "/?surface=CLAY&indoor=1",
    );
  });

  it("round-trips through parseClubFilters", () => {
    const filters: ClubFilters = {
      district: "PODGORZE",
      surface: "GRASS",
      indoor: true,
    };
    const query = new URLSearchParams(clubsHref(filters).slice(2));
    expect(parseClubFilters(Object.fromEntries(query))).toEqual(filters);
  });
});
