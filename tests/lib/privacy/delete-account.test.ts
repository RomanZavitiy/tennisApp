import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  deleteAccountStorageAndAuth,
  redactAccountData,
} from "@/lib/privacy/delete-account";

const ME = "11111111-1111-4111-8111-111111111111";

const {
  tx,
  createSupabaseAdminClient,
  storageList,
  storageRemove,
  deleteUser,
} = vi.hoisted(() => ({
  tx: {
    sparringOffer: { updateMany: vi.fn() },
    offerJoin: { updateMany: vi.fn() },
    message: { updateMany: vi.fn() },
    user: { update: vi.fn() },
  },
  createSupabaseAdminClient: vi.fn(),
  storageList: vi.fn(),
  storageRemove: vi.fn(),
  deleteUser: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    $transaction: (run: (client: typeof tx) => Promise<unknown>) => run(tx),
  },
}));
vi.mock("@/lib/supabase/admin", () => ({ createSupabaseAdminClient }));

describe("redactAccountData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tx.sparringOffer.updateMany.mockResolvedValue({ count: 0 });
    tx.offerJoin.updateMany.mockResolvedValue({ count: 0 });
    tx.message.updateMany.mockResolvedValue({ count: 0 });
    tx.user.update.mockResolvedValue(undefined);
  });

  it("cancels open/full offers, withdraws unplayed joins, redacts messages, and nulls profile fields", async () => {
    await redactAccountData(ME);

    expect(tx.sparringOffer.updateMany).toHaveBeenCalledWith({
      where: { authorId: ME, status: { in: ["OPEN", "FULL"] } },
      data: { status: "CANCELLED" },
    });
    expect(tx.offerJoin.updateMany).toHaveBeenCalledWith({
      where: {
        userId: ME,
        status: { in: ["REQUESTED", "ACCEPTED"] },
        result: null,
      },
      data: { status: "WITHDRAWN" },
    });
    expect(tx.message.updateMany).toHaveBeenCalledWith({
      where: { senderId: ME },
      data: { content: "[deleted]" },
    });
    expect(tx.user.update).toHaveBeenCalledWith({
      where: { id: ME },
      data: { name: null, email: null, birthDate: null, avatarPath: null },
    });
  });
});

describe("deleteAccountStorageAndAuth", () => {
  const admin = {
    storage: {
      from: vi.fn(() => ({ list: storageList, remove: storageRemove })),
    },
    auth: { admin: { deleteUser } },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    createSupabaseAdminClient.mockReturnValue(admin);
    deleteUser.mockResolvedValue({ error: null });
  });

  it("removes avatar files when present, then deletes the auth user", async () => {
    storageList.mockResolvedValue({
      data: [{ name: "a.jpg" }, { name: "b.png" }],
    });

    await deleteAccountStorageAndAuth(ME);

    expect(storageRemove).toHaveBeenCalledWith([`${ME}/a.jpg`, `${ME}/b.png`]);
    expect(deleteUser).toHaveBeenCalledWith(ME);
  });

  it("skips remove() when there are no avatar files, but still deletes the auth user", async () => {
    storageList.mockResolvedValue({ data: [] });

    await deleteAccountStorageAndAuth(ME);

    expect(storageRemove).not.toHaveBeenCalled();
    expect(deleteUser).toHaveBeenCalledWith(ME);
  });

  it("swallows a Storage error and still deletes the auth user", async () => {
    storageList.mockRejectedValue(new Error("storage down"));

    await expect(deleteAccountStorageAndAuth(ME)).resolves.toBeUndefined();

    expect(deleteUser).toHaveBeenCalledWith(ME);
  });

  it("throws when deleteUser returns an error", async () => {
    storageList.mockResolvedValue({ data: [] });
    deleteUser.mockResolvedValue({ error: new Error("boom") });

    await expect(deleteAccountStorageAndAuth(ME)).rejects.toThrow("boom");
  });
});
