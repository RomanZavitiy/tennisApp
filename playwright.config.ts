import { defineConfig, devices } from "@playwright/test";

// End-to-end tests run against a production build, not `pnpm dev`: that is
// what users get, and dev mode's on-demand compiling makes tests slow and flaky.
// A dedicated port keeps a running dev server on :3000 from being tested by mistake.
const PORT = 3100;
const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: "e2e",
  // Deletes test users left behind by aborted runs (task 1.18).
  globalTeardown: "./e2e/support/global-teardown.ts",
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  reporter: isCI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${String(PORT)}`,
    trace: "retain-on-failure",
    // Task 1.20: every spec asserts English copy. `locale` sets the
    // browser's Accept-Language, which the proxy reads on a visitor's first
    // request (no NEXT_LOCALE cookie yet) to pick the UI language — without
    // this, e2e would follow whatever locale the OS running the browser
    // happens to report, not necessarily English. See AGENTS.md decision
    // 2026-10-15 "Польська мова".
    locale: "en-US",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `pnpm build && pnpm start --port ${String(PORT)}`,
    url: `http://localhost:${String(PORT)}`,
    reuseExistingServer: !isCI,
    // A cold production build takes a while.
    timeout: 180_000,
  },
});
