"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { DateTimeField } from "@/components/date-field";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import type { SlotRange } from "@/lib/offers/date-time-picker";

type AddBlockResult = { ok: true } | { ok: false; message: string };

// Wider than an offer's 06:00-22:00: a block can run to a late close.
const BLOCK_SLOTS: SlotRange = { first: 6 * 60, last: 23 * 60 + 30 };

// K.17: the staff panel's form for a booking made outside SpinBuddy (phone,
// twojtenis) or for maintenance — addBlock itself re-validates and re-checks
// the overlap, this only collects the four fields.
export function AddBlockForm({
  courts,
  action,
  labels,
  earliest,
}: {
  courts: { id: string; name: string }[];
  /** Kraków time now, "YYYY-MM-DDTHH:mm": no block in the past. */
  earliest: string;
  action: (input: unknown) => Promise<AddBlockResult>;
  labels: {
    courtLabel: string;
    startLabel: string;
    endLabel: string;
    reasonLabel: string;
    submit: string;
    submitting: string;
    done: string;
  };
}) {
  const t = useTranslations("DateTimePicker");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (done) {
    return <p className="text-sm text-muted-foreground">{labels.done}</p>;
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        startTransition(async () => {
          const result = await action({
            courtId: form.get("courtId"),
            startsAt: form.get("startsAt"),
            endsAt: form.get("endsAt"),
            reason: form.get("reason"),
          });
          if (result.ok) {
            setDone(true);
          } else {
            setMessage(result.message);
          }
        });
      }}
    >
      <div className="space-y-1">
        <Label htmlFor="block-court">{labels.courtLabel}</Label>
        <NativeSelect id="block-court" name="courtId" required>
          {courts.map((court) => (
            <NativeSelectOption key={court.id} value={court.id}>
              {court.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="min-w-0 flex-1 space-y-1">
          <Label htmlFor="block-starts">{labels.startLabel}</Label>
          <DateTimeField
            id="block-starts"
            name="startsAt"
            label={labels.startLabel}
            earliest={earliest}
            placeholder={t("pickBoth")}
            slots={BLOCK_SLOTS}
          />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <Label htmlFor="block-ends">{labels.endLabel}</Label>
          <DateTimeField
            id="block-ends"
            name="endsAt"
            label={labels.endLabel}
            earliest={earliest}
            placeholder={t("pickBoth")}
            slots={BLOCK_SLOTS}
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="block-reason">{labels.reasonLabel}</Label>
        <Textarea id="block-reason" name="reason" rows={2} />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? labels.submitting : labels.submit}
      </Button>
      {message && (
        <p role="alert" className="text-sm text-destructive">
          {message}
        </p>
      )}
    </form>
  );
}
