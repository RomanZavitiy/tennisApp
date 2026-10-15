"use client";

import { useState } from "react";

import { ReportForm } from "@/components/report-form";
import type { ReportReason } from "@/lib/generated/prisma/enums";

type ReportActionResult = { ok: true } | { ok: false; message: string };

/** A toggle for ReportForm, same "details" convention as ResultForm. */
export function ReportButton({
  action,
  label = "Report",
}: {
  action: (input: {
    reason: ReportReason;
    comment?: string;
  }) => Promise<ReportActionResult>;
  label?: string;
}) {
  const [open, setOpen] = useState(false);

  if (open) {
    return <ReportForm action={action} />;
  }
  return (
    <button
      type="button"
      className="text-sm text-muted-foreground underline"
      onClick={() => {
        setOpen(true);
      }}
    >
      {label}
    </button>
  );
}
