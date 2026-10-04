import { beforeEach, describe, expect, it, vi } from "vitest";

import { saveAvatar, updateProfile } from "@/app/(member)/profile/actions";

// Session, database, Storage and redirect are replaced: what's under test is
// the order of checks and what gets saved.
const ME = "11111111-1111-4111-8111-111111111111";
const NEW = `${ME}/new.webp`;
const OLD = `${ME}/old.jpg`;

const { findUnique, update, exists, remove, redirect } = vi.hoisted(() => ({
  findUnique: vi.fn(),
  update: vi.fn(),
  exists: vi.fn(),
  remove: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("@/lib/auth/require-user", () => ({
  requireUser: () => Promise.resolve({ id: ME, email: undefined }),
}));
vi.mock("@/lib/db", () => ({ db: { user: { findUnique, update } } }));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: () =>
    Promise.resolve({ storage: { from: () => ({ exists, remove }) } }),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect }));

describe("updateProfile", () => {
  const valid = {
    name: "Ola",
    birthDate: "1995-04-12",
    gender: "FEMALE",
    district: "DEBNIKI",
    selfRatedNtrp: 4,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("saves the changes, keeps the onboarding date and returns to the profile", async () => {
    await updateProfile(valid);

    expect(update).toHaveBeenCalledWith({
      where: { id: ME },
      data: {
        name: "Ola",
        birthDate: new Date("1995-04-12T00:00:00Z"),
        gender: "FEMALE",
        district: "DEBNIKI",
        selfRatedNtrp: 4,
      },
    });
    expect(redirect).toHaveBeenCalledWith("/profile");
  });

  it("rejects input that skipped the form's checks, without saving", async () => {
    const result = await updateProfile({ ...valid, name: " ", gender: "X" });

    expect(result.fieldErrors).toEqual({
      name: "Enter your name.",
      gender: "Choose your gender.",
    });
    expect(update).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });
});

describe("saveAvatar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    exists.mockResolvedValue({ data: true, error: null });
    findUnique.mockResolvedValue({ avatarPath: OLD });
  });

  it("saves the new path, then deletes the old photo", async () => {
    await expect(saveAvatar(NEW)).resolves.toEqual({ ok: true });

    expect(update).toHaveBeenCalledWith({
      where: { id: ME },
      data: { avatarPath: NEW },
    });
    expect(remove).toHaveBeenCalledWith([OLD]);
    expect(update.mock.invocationCallOrder[0]).toBeLessThan(
      remove.mock.invocationCallOrder[0] ?? 0,
    );
  });

  it("deletes nothing on the first photo", async () => {
    findUnique.mockResolvedValue({ avatarPath: null });

    await saveAvatar(NEW);

    expect(remove).not.toHaveBeenCalled();
  });

  it("refuses a path outside the user's folder without touching anything", async () => {
    const result = await saveAvatar(
      "22222222-2222-4222-8222-222222222222/x.png",
    );

    expect(result).toEqual({ ok: false, message: "Invalid photo." });
    expect(exists).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
  });

  it("refuses a path with no uploaded file behind it", async () => {
    exists.mockResolvedValue({ data: false, error: null });

    const result = await saveAvatar(NEW);

    expect(result.ok).toBe(false);
    expect(update).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
  });
});
