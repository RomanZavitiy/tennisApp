import { describe, expect, it } from "vitest";

import {
  CLUB_EVENT_BODY_MAX,
  CLUB_EVENT_TITLE_MAX,
  clubEventSchema,
} from "@/lib/validation/club-event";

// Club news from the club panel (slice PD5, task PD5.1).
const t = (key: string) => key;
const schema = clubEventSchema(t);

describe("clubEventSchema", () => {
  it("trims the title and the text", () => {
    expect(
      schema.parse({ title: " Open day ", body: "\nSaturday 10:00 " }),
    ).toEqual({ title: "Open day", body: "Saturday 10:00" });
  });

  it.each([
    [{ title: "  ", body: "text" }, "titleRequired"],
    [{ body: "text" }, "titleRequired"],
    [{ title: "Title", body: "" }, "bodyRequired"],
    [
      { title: "x".repeat(CLUB_EVENT_TITLE_MAX + 1), body: "t" },
      "titleTooLong",
    ],
    [
      { title: "Title", body: "x".repeat(CLUB_EVENT_BODY_MAX + 1) },
      "bodyTooLong",
    ],
  ])("refuses %j with %s", (input, message) => {
    const result = schema.safeParse(input);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(message);
  });

  it("accepts text at the limits", () => {
    expect(
      schema.safeParse({
        title: "x".repeat(CLUB_EVENT_TITLE_MAX),
        body: "y".repeat(CLUB_EVENT_BODY_MAX),
      }).success,
    ).toBe(true);
  });
});
