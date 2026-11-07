"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { RateOpponentForm } from "@/components/rate-opponent-form";
import type { FeedbackTag, LevelSignal } from "@/lib/generated/prisma/enums";

type FeedbackActionResult = { ok: true } | { ok: false; message: string };

/** A toggle for RateOpponentForm, same "details" convention as ReportButton. */
export function RateOpponentButton({
  action,
}: {
  action: (input: {
    tags: FeedbackTag[];
    levelSignal: LevelSignal | null;
  }) => Promise<FeedbackActionResult>;
}) {
  const t = useTranslations("RateOpponentButton");
  const [open, setOpen] = useState(false);

  if (open) {
    return <RateOpponentForm action={action} />;
  }
  return (
    <button
      type="button"
      className="text-sm text-primary underline"
      onClick={() => {
        setOpen(true);
      }}
    >
      {t("label")}
    </button>
  );
}
