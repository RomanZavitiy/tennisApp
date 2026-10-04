import { afterEach, describe, expect, it, vi } from "vitest";

import {
  AVATAR_MAX_BYTES,
  avatarPathSchema,
  avatarUrl,
  isAvatarType,
  newAvatarPath,
} from "@/lib/profile/avatar";

const ME = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";

describe("avatar rules", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("match the bucket: 5 MB, JPEG/PNG/WebP only", () => {
    expect(AVATAR_MAX_BYTES).toBe(5_242_880);
    expect(["image/jpeg", "image/png", "image/webp"].every(isAvatarType)).toBe(
      true,
    );
    expect(
      ["image/heic", "image/gif", "image/svg+xml"].some(isAvatarType),
    ).toBe(false);
  });

  it("make a fresh path in the user's folder for every upload", () => {
    const first = newAvatarPath(ME, "image/webp");
    const second = newAvatarPath(ME, "image/webp");

    expect(first).toMatch(new RegExp(`^${ME}/[0-9a-f-]{36}\.webp$`));
    expect(second).not.toBe(first);
    expect(avatarPathSchema(ME).safeParse(first).success).toBe(true);
  });

  it.each([
    `${OTHER}/photo.png`,
    `${ME}/../${OTHER}/photo.png`,
    `${ME}/nested/photo.png`,
    `${ME}/photo.heic`,
    `${ME}/photo`,
    `${ME}/`,
    `prefix${ME}/photo.png`,
    "",
  ])("refuse the path %j", (path) => {
    expect(avatarPathSchema(ME).safeParse(path).success).toBe(false);
  });

  it("build the public URL", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abc.supabase.co");

    expect(avatarUrl(`${ME}/x.png`)).toBe(
      `https://abc.supabase.co/storage/v1/object/public/avatars/${ME}/x.png`,
    );
  });
});
