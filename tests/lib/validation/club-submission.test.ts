import { describe, expect, it } from "vitest";

import { clubSubmissionSchema } from "@/lib/validation/club-submission";
import { testTranslator } from "@/tests/helpers/translator";

const schema = clubSubmissionSchema(
  testTranslator("Validation.clubSubmission"),
);

describe("clubSubmissionSchema", () => {
  it("accepts name and address alone", () => {
    const result = schema.safeParse({
      name: "Kort Krowodrza",
      address: "ul. Przykładowa 1",
    });
    expect(result.success).toBe(true);
    expect(result.data?.districtGuess).toBeUndefined();
    expect(result.data?.notes).toBeUndefined();
  });

  it("accepts a district guess and notes", () => {
    const result = schema.safeParse({
      name: "Kort Krowodrza",
      address: "ul. Przykładowa 1",
      districtGuess: "KROWODRZA",
      notes: "Two clay courts, outdoor only.",
    });
    expect(result.success).toBe(true);
    expect(result.data?.districtGuess).toBe("KROWODRZA");
  });

  it("treats an empty district or notes as none", () => {
    const result = schema.safeParse({
      name: "Kort Krowodrza",
      address: "ul. Przykładowa 1",
      districtGuess: "",
      notes: "   ",
    });
    expect(result.success).toBe(true);
    expect(result.data?.districtGuess).toBeUndefined();
    expect(result.data?.notes).toBeUndefined();
  });

  it("rejects a missing name or address", () => {
    expect(schema.safeParse({ address: "ul. Przykładowa 1" }).success).toBe(
      false,
    );
    expect(schema.safeParse({ name: "Kort Krowodrza" }).success).toBe(false);
  });

  it("rejects an invalid district", () => {
    const result = schema.safeParse({
      name: "Kort Krowodrza",
      address: "ul. Przykładowa 1",
      districtGuess: "MADE_UP",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a name, address or notes over the limit", () => {
    expect(
      schema.safeParse({ name: "a".repeat(101), address: "ul. X 1" }).success,
    ).toBe(false);
    expect(
      schema.safeParse({ name: "Kort", address: "a".repeat(201) }).success,
    ).toBe(false);
    expect(
      schema.safeParse({
        name: "Kort",
        address: "ul. X 1",
        notes: "a".repeat(501),
      }).success,
    ).toBe(false);
  });

  it("accepts a name, address and notes at the limit", () => {
    const result = schema.safeParse({
      name: "a".repeat(100),
      address: "a".repeat(200),
      notes: "a".repeat(500),
    });
    expect(result.success).toBe(true);
  });

  it("trims name and address", () => {
    const result = schema.safeParse({
      name: "  Kort Krowodrza  ",
      address: "  ul. Przykładowa 1  ",
    });
    expect(result.data?.name).toBe("Kort Krowodrza");
    expect(result.data?.address).toBe("ul. Przykładowa 1");
  });
});
