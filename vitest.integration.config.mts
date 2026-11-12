import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// `pnpm test:integration`: tests/integration against a real, local Postgres
// (README, "Integration tests"). Separate from vitest.config.mts so that
// `pnpm test` keeps needing no database at all.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  test: {
    include: ["tests/integration/**/*.test.ts"],
    environment: "node",
    setupFiles: ["./tests/setup/next-intl.ts", "./tests/integration/setup.ts"],
    // One database for every file. Each test makes its own rows, but
    // autoConfirmExpiredResults() scans the whole table, so files run one
    // after another rather than race each other's fixtures.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
