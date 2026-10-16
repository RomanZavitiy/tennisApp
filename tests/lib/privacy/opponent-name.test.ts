import { describe, expect, it } from "vitest";

import { firstNameAndInitial } from "@/lib/privacy/opponent-name";

describe("firstNameAndInitial", () => {
  it("keeps the first name and initials the last one", () => {
    expect(firstNameAndInitial("Ola Kowalska")).toBe("Ola K.");
  });

  it("initials only the last of several names", () => {
    expect(firstNameAndInitial("Jan Maria Nowak")).toBe("Jan N.");
  });

  it("returns a single-word name unchanged", () => {
    expect(firstNameAndInitial("Ola")).toBe("Ola");
  });

  it("falls back to a generic label when there's no name", () => {
    expect(firstNameAndInitial(null)).toBe("Player");
  });

  it("trims stray whitespace", () => {
    expect(firstNameAndInitial("  Ola   Kowalska  ")).toBe("Ola K.");
  });
});
