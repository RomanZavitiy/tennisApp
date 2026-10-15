import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/cron/route";

const { autoConfirmExpiredResults } = vi.hoisted(() => ({
  autoConfirmExpiredResults: vi.fn(),
}));
vi.mock("@/lib/rating/auto-confirm", () => ({ autoConfirmExpiredResults }));

function request(authorization?: string) {
  return new NextRequest("http://localhost/api/cron", {
    headers: authorization ? { authorization } : {},
  });
}

describe("GET /api/cron", () => {
  const originalSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "test-secret";
    autoConfirmExpiredResults.mockResolvedValue(3);
  });

  afterEach(() => {
    process.env.CRON_SECRET = originalSecret;
  });

  it("refuses a request with no Authorization header", async () => {
    const response = await GET(request());

    expect(response.status).toBe(401);
    expect(autoConfirmExpiredResults).not.toHaveBeenCalled();
  });

  it("refuses the wrong secret", async () => {
    const response = await GET(request("Bearer wrong-secret"));

    expect(response.status).toBe(401);
    expect(autoConfirmExpiredResults).not.toHaveBeenCalled();
  });

  it("refuses every request when CRON_SECRET isn't configured", async () => {
    delete process.env.CRON_SECRET;

    const response = await GET(request("Bearer test-secret"));

    expect(response.status).toBe(401);
    expect(autoConfirmExpiredResults).not.toHaveBeenCalled();
  });

  it("runs auto-confirm and reports how many results it confirmed", async () => {
    const response = await GET(request("Bearer test-secret"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ autoConfirmed: 3 });
    expect(autoConfirmExpiredResults).toHaveBeenCalledTimes(1);
  });
});
