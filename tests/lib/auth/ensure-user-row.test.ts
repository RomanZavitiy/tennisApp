import { beforeEach, describe, expect, it, vi } from "vitest";

import { ensureUserRow } from "@/lib/auth/ensure-user-row";

// The database is replaced: CI has none. That one row per user really comes
// out of first and repeat sign-ins is checked end to end in e2e/session.spec.ts.
// vi.mock is hoisted above the imports, so the mock must be created with it.
const { upsert } = vi.hoisted(() => ({ upsert: vi.fn() }));

vi.mock("@/lib/db", () => ({ db: { user: { upsert } } }));

describe("ensureUserRow", () => {
  beforeEach(() => {
    upsert.mockReset();
  });

  it("creates the row keyed by the auth user id", async () => {
    await ensureUserRow("user-1");

    expect(upsert).toHaveBeenCalledWith({
      where: { id: "user-1" },
      create: { id: "user-1" },
      update: {},
    });
  });

  it("changes nothing on an existing row", async () => {
    await ensureUserRow("user-1");

    const [args] = upsert.mock.calls[0] as [{ update: object }];
    expect(args.update).toEqual({});
  });

  it("lets a database error surface instead of hiding it", async () => {
    upsert.mockRejectedValue(new Error("connection refused"));

    await expect(ensureUserRow("user-1")).rejects.toThrow("connection refused");
  });
});
