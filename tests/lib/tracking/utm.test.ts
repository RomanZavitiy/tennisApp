import { describe, expect, it } from "vitest";

import { addUtmSource } from "@/lib/tracking/utm";

describe("addUtmSource", () => {
  it("adds utm_source to a plain URL", () => {
    expect(addUtmSource("https://club.example.com/book")).toBe(
      "https://club.example.com/book?utm_source=matchfinder",
    );
  });

  it("keeps existing query parameters", () => {
    expect(addUtmSource("https://club.example.com/book?court=2&day=mon")).toBe(
      "https://club.example.com/book?court=2&day=mon&utm_source=matchfinder",
    );
  });

  it("overwrites a utm_source the club's own link already carries", () => {
    expect(
      addUtmSource("https://club.example.com/book?utm_source=google"),
    ).toBe("https://club.example.com/book?utm_source=matchfinder");
  });

  it("accepts a custom source", () => {
    expect(addUtmSource("https://club.example.com/book", "push")).toBe(
      "https://club.example.com/book?utm_source=push",
    );
  });
});
