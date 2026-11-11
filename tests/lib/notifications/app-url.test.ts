import { afterEach, describe, expect, it, vi } from "vitest";

import { appUrl } from "@/lib/notifications/app-url";

describe("appUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  function stubVercel(env: {
    VERCEL_ENV?: string;
    VERCEL_PROJECT_PRODUCTION_URL?: string;
    VERCEL_URL?: string;
  }) {
    vi.stubEnv("VERCEL_ENV", env.VERCEL_ENV);
    vi.stubEnv(
      "VERCEL_PROJECT_PRODUCTION_URL",
      env.VERCEL_PROJECT_PRODUCTION_URL,
    );
    vi.stubEnv("VERCEL_URL", env.VERCEL_URL);
  }

  it("uses the public production domain in production", () => {
    stubVercel({
      VERCEL_ENV: "production",
      VERCEL_PROJECT_PRODUCTION_URL: "spinbuddy.vercel.app",
      VERCEL_URL: "spinbuddy-abc123.vercel.app",
    });

    expect(appUrl()).toBe("https://spinbuddy.vercel.app");
  });

  it("keeps a preview deployment on its own hostname, never production", () => {
    stubVercel({
      VERCEL_ENV: "preview",
      VERCEL_PROJECT_PRODUCTION_URL: "spinbuddy.vercel.app",
      VERCEL_URL: "spinbuddy-git-feat-x.vercel.app",
    });

    expect(appUrl()).toBe("https://spinbuddy-git-feat-x.vercel.app");
  });

  it("falls back to the deployment hostname if production has no domain set", () => {
    stubVercel({
      VERCEL_ENV: "production",
      VERCEL_URL: "spinbuddy-abc123.vercel.app",
    });

    expect(appUrl()).toBe("https://spinbuddy-abc123.vercel.app");
  });

  it("uses localhost outside Vercel", () => {
    stubVercel({});

    expect(appUrl()).toBe("http://localhost:3000");
  });
});
