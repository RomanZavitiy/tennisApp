import type { ReportReason } from "@/lib/generated/prisma/enums";

// Display labels for a report's reason (task 3.19) — the enum's own values
// are the stable, code-facing names (ReportReason), same split as every
// other label map in lib/ (e.g. COURT_STATUS_LABELS).
export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  NO_SHOW: "Didn't show up",
  ABUSIVE: "Abusive behaviour",
  FAKE_SPAM: "Fake profile or spam",
  INAPPROPRIATE: "Inappropriate content",
  OTHER: "Other",
};
