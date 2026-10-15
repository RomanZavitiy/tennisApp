"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { ReportReason } from "@/lib/generated/prisma/enums";
import type { ReportReason as ReportReasonType } from "@/lib/generated/prisma/enums";
import { REPORT_COMMENT_MAX } from "@/lib/validation/report";

type ReportActionResult = { ok: true } | { ok: false; message: string };

// The reason + comment form behind every "Report" button (task 3.19): the
// offer page, a player's profile, and beside a message in a thread all
// share this one component, each only supplying where the report goes.
export function ReportForm({
  action,
}: {
  action: (input: {
    reason: ReportReasonType;
    comment?: string;
  }) => Promise<ReportActionResult>;
}) {
  const t = useTranslations("ReportForm");
  const tReason = useTranslations("ReportReason");
  const [reason, setReason] = useState<ReportReasonType | "">("");
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  if (done) {
    return <p className="text-sm text-muted-foreground">{t("done")}</p>;
  }

  return (
    <form
      className="mt-2 space-y-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (!reason) {
          setError(t("reasonRequired"));
          return;
        }
        setError(null);
        startTransition(async () => {
          const result = await action({
            reason,
            comment: comment.trim() || undefined,
          });
          if (result.ok) {
            setDone(true);
          } else {
            setError(result.message);
          }
        });
      }}
    >
      <NativeSelect
        aria-label={t("reasonFieldLabel")}
        value={reason}
        onChange={(event) => {
          setReason(event.target.value as ReportReasonType);
        }}
      >
        <NativeSelectOption value="">{t("chooseReason")}</NativeSelectOption>
        {Object.values(ReportReason).map((value) => (
          <NativeSelectOption key={value} value={value}>
            {tReason(value)}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      <Textarea
        aria-label={t("detailsFieldLabel")}
        value={comment}
        onChange={(event) => {
          setComment(event.target.value);
        }}
        maxLength={REPORT_COMMENT_MAX}
        rows={2}
        placeholder={t("detailsPlaceholder")}
      />
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? t("reporting") : t("submit")}
      </Button>
    </form>
  );
}
