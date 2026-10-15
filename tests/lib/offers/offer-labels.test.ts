import { createFormatter } from "next-intl";
import { describe, expect, it } from "vitest";

import { formatKrakowTime } from "@/lib/offers/krakow-time";
import {
  formatLabel,
  levelLabel,
  placeLabel,
  spotsLabel,
} from "@/lib/offers/offer-labels";
import { testTranslator } from "@/tests/helpers/translator";

const t = testTranslator("OfferLabels");
const format = createFormatter({ locale: "en", timeZone: "Europe/Warsaw" });

describe("offer labels", () => {
  it("name the format", () => {
    expect(formatLabel(t, { format: "SINGLES", hasPartner: false })).toBe(
      "Singles",
    );
    expect(formatLabel(t, { format: "DOUBLES", hasPartner: false })).toBe(
      "Doubles",
    );
    expect(formatLabel(t, { format: "DOUBLES", hasPartner: true })).toBe(
      "Doubles · has a partner",
    );
  });

  it("count the spots left", () => {
    expect(spotsLabel(t, 3)).toBe("3 spots left");
    expect(spotsLabel(t, 1)).toBe("1 spot left");
    expect(spotsLabel(t, 0)).toBe("Full");
  });

  it.each([
    [3, 4.5, "NTRP 3.0–4.5"],
    [4, 4, "NTRP 4.0"],
    [3.5, null, "NTRP 3.5+"],
    [null, 5, "NTRP up to 5.0"],
    [null, null, "Any level"],
  ])("show the level %j–%j as %s", (min, max, label) => {
    expect(levelLabel(t, min, max)).toBe(label);
  });

  it("show the start in Kraków time", () => {
    expect(formatKrakowTime(format, new Date("2026-10-20T16:00:00Z"))).toBe(
      "Tue, Oct 20, 18:00",
    );
    expect(formatKrakowTime(format, new Date("2026-12-31T23:30:00Z"))).toBe(
      "Fri, Jan 1, 00:30",
    );
  });
});

describe("placeLabel", () => {
  it("names the club, the district, or both", () => {
    expect(
      placeLabel(
        { club: { name: "KS Nadwiślan" }, district: "DEBNIKI" },
        "Dębniki",
      ),
    ).toBe("KS Nadwiślan, Dębniki");
    expect(
      placeLabel({ club: { name: "Kryspinów" }, district: null }, null),
    ).toBe("Kryspinów");
    expect(placeLabel({ club: null, district: "PODGORZE" }, "Podgórze")).toBe(
      "Podgórze",
    );
  });
});
