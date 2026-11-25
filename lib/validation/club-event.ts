import { z } from "zod";

// A piece of club news posted from the club panel (slice PD5, task PD5.1).
// The columns allow 100 / 1000 characters (club_events); these are the
// limits a staff member can actually type.

export const CLUB_EVENT_TITLE_MAX = 80;
export const CLUB_EVENT_BODY_MAX = 800;

type ValidationT = (key: string, values?: Record<string, number>) => string;

function trimmedText(t: ValidationT, max: number, keys: [string, string]) {
  const [requiredKey, tooLongKey] = keys;
  return z.preprocess(
    (value) => (typeof value === "string" ? value.trim() : value),
    z
      .string(t(requiredKey))
      .min(1, t(requiredKey))
      .max(max, t(tooLongKey, { max })),
  );
}

/** `t` is a translator for the "Validation.clubEvent" namespace. */
export function clubEventSchema(t: ValidationT) {
  return z.object({
    title: trimmedText(t, CLUB_EVENT_TITLE_MAX, [
      "titleRequired",
      "titleTooLong",
    ]),
    body: trimmedText(t, CLUB_EVENT_BODY_MAX, ["bodyRequired", "bodyTooLong"]),
  });
}

export type ClubEventInput = z.infer<ReturnType<typeof clubEventSchema>>;
