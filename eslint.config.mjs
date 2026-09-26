import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";
import tseslint from "typescript-eslint";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Type-aware rules (they read tsconfig types): catch un-awaited promises,
  // unsafe `any` flows and similar bugs that plain syntax rules can't see.
  {
    files: ["**/*.{ts,tsx,mts}"],
    extends: [tseslint.configs.strictTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  // AGENTS.md §3: no console.log in app code. warn/error stay allowed for
  // real diagnostics.
  {
    files: ["app/**", "lib/**", "components/**"],
    rules: {
      "no-console": ["error", { allow: ["warn", "error"] }],
    },
  },
  // Last, so it switches off any stylistic rule that would fight Prettier.
  prettier,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
