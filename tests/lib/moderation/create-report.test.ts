import { beforeEach, describe, expect, it, vi } from "vitest";

import { createReport } from "@/lib/moderation/create-report";

const ME = "11111111-1111-4111-8111-111111111111";
const TARGET = "22222222-2222-4222-8222-222222222222";
const REPORT = "33333333-3333-4333-8333-333333333333";

const { reportCreateManyAndReturn, checkRateLimit, maybeAutoblock } =
  vi.hoisted(() => ({
    reportCreateManyAndReturn: vi.fn(),
    checkRateLimit: vi.fn(),
    maybeAutoblock: vi.fn(),
  }));

vi.mock("@/lib/db", () => ({
  db: { report: { createManyAndReturn: reportCreateManyAndReturn } },
}));
vi.mock("@/lib/rate-limit/check-rate-limit", () => ({ checkRateLimit }));
vi.mock("@/lib/moderation/autoblock", () => ({ maybeAutoblock }));

const input = { reason: "ABUSIVE" as const, comment: undefined };

describe("createReport", () => {
  beforeEach(() => {
    reportCreateManyAndReturn.mockReset();
    checkRateLimit.mockReset();
    maybeAutoblock.mockReset();
    checkRateLimit.mockResolvedValue({ ok: true });
    maybeAutoblock.mockResolvedValue(undefined);
  });

  it("refuses reporting yourself, without writing or counting towards the limit", async () => {
    const result = await createReport({
      reporterId: ME,
      targetUserId: ME,
      input,
    });

    expect(result).toEqual({
      ok: false,
      message: "You can't report yourself.",
    });
    expect(checkRateLimit).not.toHaveBeenCalled();
    expect(reportCreateManyAndReturn).not.toHaveBeenCalled();
  });

  it("refuses once the daily report limit is hit", async () => {
    checkRateLimit.mockResolvedValue({
      ok: false,
      message: "You've filed a lot of reports today. Try again tomorrow.",
    });

    const result = await createReport({
      reporterId: ME,
      targetUserId: TARGET,
      input,
    });

    expect(result).toEqual({
      ok: false,
      message: "You've filed a lot of reports today. Try again tomorrow.",
    });
    expect(reportCreateManyAndReturn).not.toHaveBeenCalled();
  });

  it("refuses a duplicate report on the same object", async () => {
    reportCreateManyAndReturn.mockResolvedValue([]);

    const result = await createReport({
      reporterId: ME,
      targetUserId: TARGET,
      offerId: "offer-1",
      input,
    });

    expect(result).toEqual({
      ok: false,
      message: "You've already reported this.",
    });
    expect(maybeAutoblock).not.toHaveBeenCalled();
  });

  it("writes the report and checks the autoblock threshold", async () => {
    reportCreateManyAndReturn.mockResolvedValue([{ id: REPORT }]);

    const result = await createReport({
      reporterId: ME,
      targetUserId: TARGET,
      messageId: "message-1",
      input: { reason: "FAKE_SPAM", comment: "Looks like a bot." },
    });

    expect(result).toEqual({ ok: true });
    expect(reportCreateManyAndReturn).toHaveBeenCalledWith({
      data: [
        {
          reporterId: ME,
          targetUserId: TARGET,
          offerId: undefined,
          messageId: "message-1",
          reason: "FAKE_SPAM",
          comment: "Looks like a bot.",
        },
      ],
      select: { id: true },
      skipDuplicates: true,
    });
    expect(maybeAutoblock).toHaveBeenCalledWith(TARGET);
  });
});
