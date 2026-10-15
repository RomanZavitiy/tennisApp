"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import type { ReportReason } from "@/lib/generated/prisma/enums";
import { REPORT_REASON_LABELS } from "@/lib/moderation/report-labels";
import { REPORT_COMMENT_MAX } from "@/lib/validation/report";

type ReportActionResult = { ok: true } | { ok: false; message: string };

// The reason + comment form behind every "Report" button (task 3.19): the
// offer page, a player's profile, and beside a message in a thread all
// share this one component, each only supplying where the report goes.
export function ReportForm({
  action,
}: {
  action: (input: {
    reason: ReportReason;
    comment?: string;
  }) => Promise<ReportActionResult>;
}) {
  const [reason, setReason] = useState<ReportReason | "">("");
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  if (done) {
    return (
      <p className="text-sm text-muted-foreground">
        Reported. An admin will review it.
      </p>
    );
  }

  return (
    <form
      className="mt-2 space-y-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (!reason) {
          setError("Choose a reason.");
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
        aria-label="Reason"
        value={reason}
        onChange={(event) => {
          setReason(event.target.value as ReportReason);
        }}
      >
        <NativeSelectOption value="">Choose a reason…</NativeSelectOption>
        {Object.entries(REPORT_REASON_LABELS).map(([value, label]) => (
          <NativeSelectOption key={value} value={value}>
            {label}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      <Textarea
        aria-label="Details (optional)"
        value={comment}
        onChange={(event) => {
          setComment(event.target.value);
        }}
        maxLength={REPORT_COMMENT_MAX}
        rows={2}
        placeholder="Add details (optional)"
      />
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Reporting…" : "Submit report"}
      </Button>
    </form>
  );
}
