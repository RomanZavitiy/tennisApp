import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createSupabaseServerClient } from "@/lib/supabase/server";

// The server client must find the session in the request cookies. next/headers
// is replaced with an in-memory cookie jar, and the cookie is written in the
// format @supabase/ssr itself uses: "base64-" + base64url(JSON session) under
// sb-<project-ref>-auth-token. The session doesn't expire soon, so no refresh
// request goes to the network.
const jar = new Map<string, string>();

vi.mock("next/headers", () => ({
  cookies: () =>
    Promise.resolve({
      getAll: () =>
        [...jar].map(([name, value]) => ({
          name,
          value,
        })),
      set: (name: string, value: string) => jar.set(name, value),
    }),
}));

const session = {
  access_token: "test-access-token",
  refresh_token: "test-refresh-token",
  token_type: "bearer",
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  user: { id: "00000000-0000-0000-0000-000000000001", aud: "authenticated" },
};

describe("createSupabaseServerClient", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://testref.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_x");
    jar.clear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("reads the session from the auth cookie", async () => {
    jar.set(
      "sb-testref-auth-token",
      `base64-${Buffer.from(JSON.stringify(session)).toString("base64url")}`,
    );

    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getSession();

    expect(data.session?.access_token).toBe("test-access-token");
    expect(data.session?.user.id).toBe(session.user.id);
  });

  it("has no session without the cookie", async () => {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getSession();

    expect(data.session).toBeNull();
  });
});
