import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  approveSubmission,
  rejectSubmission,
} from "@/app/admin/club-submissions/actions";

const ADMIN = "11111111-1111-4111-8111-111111111111";
const SUBMISSION = "22222222-2222-4222-8222-222222222222";

const { requireAdmin, clubSubmissionUpdateMany } = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  clubSubmissionUpdateMany: vi.fn(),
}));

vi.mock("@/lib/auth/require-admin", () => ({ requireAdmin }));
vi.mock("@/lib/db", () => ({
  db: { clubSubmission: { updateMany: clubSubmissionUpdateMany } },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

describe("club submission actions require an admin", () => {
  it("approveSubmission propagates requireAdmin's 404", async () => {
    requireAdmin.mockRejectedValue(new Error("not-found"));

    await expect(approveSubmission(SUBMISSION)).rejects.toThrow("not-found");
    expect(clubSubmissionUpdateMany).not.toHaveBeenCalled();
  });

  it("rejectSubmission propagates requireAdmin's 404", async () => {
    requireAdmin.mockRejectedValue(new Error("not-found"));

    await expect(rejectSubmission(SUBMISSION)).rejects.toThrow("not-found");
    expect(clubSubmissionUpdateMany).not.toHaveBeenCalled();
  });
});

describe("approveSubmission", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdmin.mockResolvedValue({ id: ADMIN });
  });

  it("approves a pending submission, recording who and when", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-30T10:00:00Z"));
    clubSubmissionUpdateMany.mockResolvedValue({ count: 1 });

    await expect(approveSubmission(SUBMISSION)).resolves.toEqual({
      ok: true,
    });

    expect(clubSubmissionUpdateMany).toHaveBeenCalledWith({
      where: { id: SUBMISSION, status: "PENDING" },
      data: {
        status: "APPROVED",
        reviewedById: ADMIN,
        reviewedAt: new Date("2026-10-30T10:00:00Z"),
      },
    });
    vi.useRealTimers();
  });

  it("refuses a submission that was already decided", async () => {
    clubSubmissionUpdateMany.mockResolvedValue({ count: 0 });

    await expect(approveSubmission(SUBMISSION)).resolves.toEqual({
      ok: false,
      message: "This submission was already decided.",
    });
  });

  it("refuses a bad id", async () => {
    await expect(approveSubmission("not-a-uuid")).resolves.toEqual({
      ok: false,
      message: "This club submission doesn't exist.",
    });
    expect(clubSubmissionUpdateMany).not.toHaveBeenCalled();
  });
});

describe("rejectSubmission", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdmin.mockResolvedValue({ id: ADMIN });
  });

  it("rejects a pending submission with a reason", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-30T10:00:00Z"));
    clubSubmissionUpdateMany.mockResolvedValue({ count: 1 });

    await expect(
      rejectSubmission(SUBMISSION, "Duplicate of an existing club"),
    ).resolves.toEqual({ ok: true });

    expect(clubSubmissionUpdateMany).toHaveBeenCalledWith({
      where: { id: SUBMISSION, status: "PENDING" },
      data: {
        status: "REJECTED",
        reviewedById: ADMIN,
        reviewedAt: new Date("2026-10-30T10:00:00Z"),
        rejectionReason: "Duplicate of an existing club",
      },
    });
    vi.useRealTimers();
  });

  it("rejects without a reason", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-30T10:00:00Z"));
    clubSubmissionUpdateMany.mockResolvedValue({ count: 1 });

    await rejectSubmission(SUBMISSION);

    expect(clubSubmissionUpdateMany).toHaveBeenCalledWith({
      where: { id: SUBMISSION, status: "PENDING" },
      data: {
        status: "REJECTED",
        reviewedById: ADMIN,
        reviewedAt: new Date("2026-10-30T10:00:00Z"),
        rejectionReason: undefined,
      },
    });
    vi.useRealTimers();
  });

  it("refuses a submission that was already decided", async () => {
    clubSubmissionUpdateMany.mockResolvedValue({ count: 0 });

    await expect(rejectSubmission(SUBMISSION)).resolves.toEqual({
      ok: false,
      message: "This submission was already decided.",
    });
  });
});
