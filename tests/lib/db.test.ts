import { describe, expect, it } from "vitest";

import { db } from "@/lib/db";

// Smoke test for the test setup itself: the "@/" alias resolves and lib/ code
// loads. Creating the client doesn't open a connection, so no database is needed.
describe("db", () => {
  it("is cached on globalThis outside production", () => {
    const cached = (globalThis as { prisma?: unknown }).prisma;

    expect(cached).toBe(db);
  });
});
