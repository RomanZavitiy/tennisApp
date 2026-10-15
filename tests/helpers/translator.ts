import type { AbstractIntlMessages } from "next-intl";
import { createTranslator } from "next-intl";

import enJson from "@/messages/en.json";

// Widened on purpose: a literal import's type would make next-intl narrow
// t()'s key parameter to this one namespace's exact keys, which the lib/
// helpers under test (formatLabel, reliabilityLabel, the Zod schema
// factories…) type generically as `(key: string, …) => string` — task 1.20.
const en = enJson as unknown as AbstractIntlMessages;

/**
 * A translator over the real messages/en.json catalog, for a lib/ unit
 * test. Cast to a plain function type: next-intl's own `Translator` type
 * is generic over the exact message shape in a way that doesn't line up
 * with the lib/ helpers under test, which deliberately type their `t`
 * parameter as a plain `(key, values?) => string` so they don't need to
 * know about next-intl at all.
 */
export function testTranslator(
  namespace: string,
): (key: string, values?: Record<string, number | string>) => string {
  return createTranslator({
    locale: "en",
    messages: en,
    namespace,
  }) as unknown as (
    key: string,
    values?: Record<string, number | string>,
  ) => string;
}
