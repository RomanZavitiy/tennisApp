import { describe, expect, it } from "vitest";

import { formatKrakowTime } from "@/lib/offers/krakow-time";
import {
  formatLabel,
  levelLabel,
  placeLabel,
  spotsLabel,
} from "@/lib/offers/offer-labels";

describe("offer labels", () => {
  it("name the format", () => {
    expect(formatLabel({ format: "SINGLES", hasPartner: false })).toBe(
      "Singles",
    );
    expect(formatLabel({ format: "DOUBLES", hasPartner: false })).toBe(
      "Doubles",
    );
    expect(formatLabel({ format: "DOUBLES", hasPartner: true })).toBe(
      "Doubles · has a partner",
    );
  });

  it("count the spots left", () => {
    expect(spotsLabel(3)).toBe("3 spots left");
    expect(spotsLabel(1)).toBe("1 spot left");
    expect(spotsLabel(0)).toBe("Full");
  });

  it.each([
    [3, 4.5, "NTRP 3.0–4.5"],
    [4, 4, "NTRP 4.0"],
    [3.5, null, "NTRP 3.5+"],
    [null, 5, "NTRP up to 5.0"],
    [null, null, "Any level"],
  ])("show the level %j–%j as %s", (min, max, label) => {
    expect(levelLabel(min, max)).toBe(label);
  });

  it("show the start in Kraków time", () => {
    expect(formatKrakowTime(new Date("2026-10-20T16:00:00Z"))).toBe(
      "Tue 20 Oct, 18:00",
    );
    expect(formatKrakowTime(new Date("2026-12-31T23:30:00Z"))).toBe(
      "Fri 1 Jan, 00:30",
    );
  });
});

describe("placeLabel", () => {
  it("names the club, the district, or both", () => {
    expect(
      placeLabel({ club: { name: "KS Nadwiślan" }, district: "DEBNIKI" }),
    ).toBe("KS Nadwiślan, Dębniki");
    expect(placeLabel({ club: { name: "Kryspinów" }, district: null })).toBe(
      "Kryspinów",
    );
    expect(placeLabel({ club: null, district: "PODGORZE" })).toBe("Podgórze");
  });
});
