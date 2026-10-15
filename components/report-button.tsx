"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { ReportForm } from "@/components/report-form";
import type { ReportReason } from "@/lib/generated/prisma/enums";

type ReportActionResult = { ok: true } | { ok: false; message: string };

/** A toggle for ReportForm, same "details" convention as ResultForm. */
export function ReportButton({
  action,
  label,
}: {
  action: (input: {
    reason: ReportReason;
    comment?: string;
  }) => Promise<ReportActionResult>;
  label?: string;
}) {
  const t = useTranslations("ReportButton");
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
      {label ?? t("defaultLabel")}
    </button>
  );
}
