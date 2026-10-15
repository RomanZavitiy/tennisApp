import type { AbstractIntlMessages } from "next-intl";
import { createFormatter, createTranslator } from "next-intl";
import { vi } from "vitest";

import enJson from "@/messages/en.json";

// Widened on purpose: a literal import's type would make next-intl narrow
// every t() call in production code to this one namespace's exact keys
// (see the decision 2026-10-15 for why that's wrong here).
const en = enJson as AbstractIntlMessages;

// Server actions call getTranslations()/getFormatter() (next-intl/server),
// which normally read the NEXT_LOCALE cookie through next/headers — not
// available when a test calls an action function directly, outside any
// Next.js request. Unit tests always run in English (same reasoning as the
// e2e tests — decision 2026-10-15 "Польська мова"): this stub backs both
// with the real messages/en.json catalog, so a test asserting the exact
// English copy still catches a typo or a missing key, not just a mock.
vi.mock("next-intl/server", () => ({
  getTranslations: (namespace?: string) =>
    Promise.resolve(
      createTranslator({ locale: "en", messages: en, namespace }),
    ),
  getFormatter: () =>
    Promise.resolve(
      createFormatter({ locale: "en", timeZone: "Europe/Warsaw" }),
    ),
  getLocale: () => Promise.resolve("en"),
  getMessages: () => Promise.resolve(en),
}));
