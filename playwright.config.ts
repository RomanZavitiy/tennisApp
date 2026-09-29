import { defineConfig, devices } from "@playwright/test";

// End-to-end tests run against a production build, not `pnpm dev`: that is
// what users get, and dev mode's on-demand compiling makes tests slow and flaky.
// A dedicated port keeps a running dev server on :3000 from being tested by mistake.
const PORT = 3100;
const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: "e2e",
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  reporter: isCI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${String(PORT)}`,
    trace: "retain-on-failure",
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
