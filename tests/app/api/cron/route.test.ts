import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/cron/route";

const { autoConfirmExpiredResults, runNotificationReminders } = vi.hoisted(
  () => ({
    autoConfirmExpiredResults: vi.fn(),
    runNotificationReminders: vi.fn(),
  }),
);
vi.mock("@/lib/rating/auto-confirm", () => ({ autoConfirmExpiredResults }));
vi.mock("@/lib/notifications/reminders", () => ({ runNotificationReminders }));

function request(authorization?: string, job?: string) {
  const url = job
    ? `http://localhost/api/cron?job=${job}`
    : "http://localhost/api/cron";
  return new NextRequest(url, {
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
    expect(runNotificationReminders).not.toHaveBeenCalled();
  });

  it("runs the reminders job instead when asked, not auto-confirm", async () => {
    runNotificationReminders.mockResolvedValue({
      matchReminders: 1,
      howDidItGoPrompts: 2,
      resultConfirmationReminders: 0,
    });

    const response = await GET(request("Bearer test-secret", "reminders"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      matchReminders: 1,
      howDidItGoPrompts: 2,
      resultConfirmationReminders: 0,
    });
    expect(runNotificationReminders).toHaveBeenCalledTimes(1);
    expect(autoConfirmExpiredResults).not.toHaveBeenCalled();
  });

  it("still requires the secret for the reminders job", async () => {
    const response = await GET(request(undefined, "reminders"));

    expect(response.status).toBe(401);
    expect(runNotificationReminders).not.toHaveBeenCalled();
  });
});
