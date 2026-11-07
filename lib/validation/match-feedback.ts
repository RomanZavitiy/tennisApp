import { z } from "zod";

import { FeedbackTag, LevelSignal } from "@/lib/generated/prisma/enums";

// A feedback submission's shape (slice W, task W.1): up to 3 tags, no
// duplicates, plus an optional level signal. No free text, by design (owner
// decision 2026-11-07) -- there's nothing else to validate. Postgres's own
// CHECK on `tags` only caps the count (it can't de-dupe without a subquery,
// decisions.md), so uniqueness is this schema's job.

export const matchFeedbackSchema = z.object({
  tags: z
    .array(z.enum(FeedbackTag))
    .max(3)
    .refine((tags) => new Set(tags).size === tags.length),
  levelSignal: z.enum(LevelSignal).nullable(),
});

export type MatchFeedbackInput = z.infer<typeof matchFeedbackSchema>;
