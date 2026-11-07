import { describe, expect, it } from "vitest";
import { z } from "zod";

import { zodFieldErrors } from "@/lib/validation/field-errors";

const schema = z.object({
  name: z.string().min(2, "too short").max(3, "too long"),
  age: z.number("not a number"),
  nested: z.object({ city: z.string("no city") }).optional(),
});

function errorFor(input: unknown) {
  const parsed = schema.safeParse(input);
  if (parsed.success) throw new Error("expected a failure");
  return parsed.error;
}

describe("zodFieldErrors", () => {
  it("returns the message for each listed field", () => {
    expect(
      zodFieldErrors(errorFor({ name: "a", age: "x" }), ["name", "age"]),
    ).toEqual({
      name: "too short",
      age: "not a number",
    });
  });

  it("keeps only the first message per field", () => {
    const error = new z.ZodError([
      { code: "custom", path: ["name"], message: "first", input: "" },
      { code: "custom", path: ["name"], message: "second", input: "" },
    ]);
    expect(zodFieldErrors(error, ["name"])).toEqual({ name: "first" });
  });

  it("drops fields that aren't listed", () => {
    expect(zodFieldErrors(errorFor({ name: "a", age: "x" }), ["name"])).toEqual(
      {
        name: "too short",
      },
    );
  });

  it("files a nested issue under its top-level field", () => {
    expect(
      zodFieldErrors(errorFor({ name: "ab", age: 1, nested: {} }), ["nested"]),
    ).toEqual({ nested: "no city" });
  });

  it("returns nothing when the payload isn't an object", () => {
    expect(zodFieldErrors(errorFor("nope"), ["name", "age"])).toEqual({});
  });
});
