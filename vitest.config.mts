import { fileURLToPath } from "node:url";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Same "@/" alias as tsconfig.json, so tests import code the way the app does.
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  test: {
    // Unit/integration tests only; Playwright specs live in e2e/ (task 0.23).
    include: ["tests/**/*.test.ts"],
    // tests/integration needs a real Postgres: its own config and command
    // (vitest.integration.config.mts, `pnpm test:integration`).
    exclude: [...configDefaults.exclude, "tests/integration/**"],
    environment: "node",
    // Stubs next-intl/server (task 1.20) — see the file for why.
    setupFiles: ["./tests/setup/next-intl.ts"],
  },
});
