import { z } from "zod";

// A thread message (task 3.16): one schema the sendMessage server action
// checks every time, since it's the only writer (the content CHECK in the
// migration is just VARCHAR(2000), an outer bound — this is the real limit
// a player sees).

export const MESSAGE_MAX = 2000;

/** `t` is a translator for the "Validation.message" namespace (task 1.20). */
export function messageContentSchema(
  t: (key: string, values?: Record<string, number>) => string,
) {
  return z
    .string(t("required"))
    .trim()
    .min(1, t("required"))
    .max(MESSAGE_MAX, t("tooLong", { max: MESSAGE_MAX }));
}
