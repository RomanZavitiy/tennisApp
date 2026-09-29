import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Same "@/" alias as tsconfig.json, so tests import code the way the app does.
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  test: {
    // Unit/integration tests only; Playwright specs live in e2e/ (task 0.23).
    include: ["tests/**/*.test.ts"],
    environment: "node",
  },
});
