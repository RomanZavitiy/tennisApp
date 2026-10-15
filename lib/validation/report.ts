import { z } from "zod";

import { ReportReason } from "@/lib/generated/prisma/enums";

// A report (task 3.19): one schema the three thin server actions
// (reportOffer, reportPlayer, reportMessage) all check, since none of them
// trust the browser's validation alone.

export const REPORT_COMMENT_MAX = 500;

// A textarea sends "" when left empty; treat it as "not given".
const emptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

export const reportInputSchema = z.object({
  reason: z.enum(ReportReason, "Choose a reason."),
  comment: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .max(
        REPORT_COMMENT_MAX,
        `Keep the comment under ${String(REPORT_COMMENT_MAX)} characters.`,
      )
      .optional(),
  ),
});

export type ReportInput = z.infer<typeof reportInputSchema>;
