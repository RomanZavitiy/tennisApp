import { z } from "zod";

import { ReportReason } from "@/lib/generated/prisma/enums";

// A report (task 3.19): one schema the three thin server actions
// (reportOffer, reportPlayer, reportMessage) all check, since none of them
// trust the browser's validation alone.

export const REPORT_COMMENT_MAX = 500;

type ValidationT = (key: string, values?: Record<string, number>) => string;

// A textarea sends "" when left empty; treat it as "not given".
const emptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

/** `t` is a translator for the "Validation.report" namespace (task 1.20). */
export function reportInputSchema(t: ValidationT) {
  return z.object({
    reason: z.enum(ReportReason, t("reasonRequired")),
    comment: z.preprocess(
      emptyToUndefined,
      z
        .string()
        .trim()
        .max(
          REPORT_COMMENT_MAX,
          t("commentTooLong", { max: REPORT_COMMENT_MAX }),
        )
        .optional(),
    ),
  });
}

export type ReportInput = z.infer<ReturnType<typeof reportInputSchema>>;
