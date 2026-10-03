import { afterEach, describe, expect, it, vi } from "vitest";

import { supabaseEnv } from "@/lib/supabase/env";

describe("supabaseEnv", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns the URL and publishable key", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abc.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_x");

    expect(supabaseEnv()).toEqual({
      url: "https://abc.supabase.co",
      publishableKey: "sb_publishable_x",
    });
  });

  it("throws when a variable is missing or empty", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abc.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");

    expect(() => supabaseEnv()).toThrow(/must be set/);
  });
});
