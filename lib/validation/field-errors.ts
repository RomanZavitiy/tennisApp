import type { z } from "zod";

// The first Zod message per known top-level field, for a form to show next
// to that field. Issues on any other path (or on the request as a whole —
// e.g. a payload that isn't an object) are dropped: the forms never send
// one, so the action only gets `ok: false`.
export function zodFieldErrors<K extends string>(
  error: z.ZodError,
  fields: readonly K[],
): Partial<Record<K, string>> {
  const known = new Set<string>(fields);
  const fieldErrors: Partial<Record<K, string>> = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && known.has(field)) {
      fieldErrors[field as K] ??= issue.message;
    }
  }
  return fieldErrors;
}
