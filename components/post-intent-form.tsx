"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { TIMES_OF_DAY } from "@/lib/offers/feed-filters";
import { DISTRICT_LABELS } from "@/lib/profile/options";
import {
  NOTE_MAX,
  playIntentSchema,
  type PlayIntentInput,
  type PostPlayIntentResult,
} from "@/lib/validation/play-intent";

// Fields whose schema is an array (times, districts) give RHF's own
// FieldError a shape too strict for the simple {message} this form reads
// from it; same loose type ClubSubmissionForm's own FieldErrorLike uses.
type FieldErrorLike = { message?: string | undefined } | undefined;

/**
 * "Хочу зіграти" (slice U2, task U2.1/U2.2): same shape as
 * ClubSubmissionForm — Zod checks everything in the browser first,
 * whatever postPlayIntent still rejects comes back as per-field messages.
 * Posting again just replaces today's — or any day's — intent, so this
 * never needs a "cancel" state, only a "posted" one.
 */
export function PostIntentForm({
  action,
  defaultDate,
}: {
  action: (values: PlayIntentInput) => Promise<PostPlayIntentResult>;
  /** Kraków "today", as "YYYY-MM-DD". */
  defaultDate: string;
}) {
  const t = useTranslations("PostIntentForm");
  const tOfferFilters = useTranslations("OfferFilters");
  const tOfferLabels = useTranslations("OfferLabels");
  const tValidation = useTranslations("Validation.playIntent");
  const [posted, setPosted] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PlayIntentInput>({
    resolver: zodResolver(playIntentSchema(tValidation)),
    defaultValues: {
      date: defaultDate,
      times: [],
      districts: [],
      format: "SINGLES",
      note: "",
    },
  });

  if (posted) {
    return <p className="text-sm text-muted-foreground">{t("posted")}</p>;
  }

  async function onSubmit(values: PlayIntentInput) {
    const result = await action(values);
    if (result.ok) {
      setPosted(true);
      return;
    }
    for (const [field, message] of Object.entries(result.fieldErrors)) {
      setError(field as keyof PlayIntentInput, { message });
    }
    if (result.message) {
      setError("root", { message: result.message });
    }
  }

  return (
    <form
      noValidate
      onSubmit={(event) => void handleSubmit(onSubmit)(event)}
      className="space-y-5"
    >
      <Field id="date" label={t("dateLabel")} error={errors.date}>
        <Input id="date" type="date" {...register("date")} />
      </Field>

      <Field id="times" label={t("timesLabel")} error={errors.times}>
        <div className="flex flex-wrap gap-3">
          {TIMES_OF_DAY.map((time) => (
            <label key={time} className="flex items-center gap-1.5 text-sm">
              <input type="checkbox" value={time} {...register("times")} />
              {tOfferFilters(`time.${time}`)}
            </label>
          ))}
        </div>
      </Field>

      <Field
        id="districts"
        label={t("districtsLabel")}
        error={errors.districts}
      >
        <div className="grid grid-cols-2 gap-1.5">
          {Object.entries(DISTRICT_LABELS).map(([value, label]) => (
            <label key={value} className="flex items-center gap-1.5 text-sm">
              <input type="checkbox" value={value} {...register("districts")} />
              {label}
            </label>
          ))}
        </div>
      </Field>

      <Field id="format" label={t("formatLabel")} error={errors.format}>
        <NativeSelect id="format" className="w-full" {...register("format")}>
          <NativeSelectOption value="SINGLES">
            {tOfferLabels("singles")}
          </NativeSelectOption>
          <NativeSelectOption value="DOUBLES">
            {tOfferLabels("doubles")}
          </NativeSelectOption>
        </NativeSelect>
      </Field>

      <Field
        id="note"
        label={t("noteLabel")}
        hint={t("noteHint", { max: NOTE_MAX })}
        error={errors.note}
      >
        <Textarea id="note" rows={2} {...register("note")} />
      </Field>

      <ErrorText id="root" error={errors.root} />

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? t("posting") : t("submit")}
      </Button>
    </form>
  );
}

function ErrorText({ id, error }: { id: string; error: FieldErrorLike }) {
  return error ? (
    <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
      {error.message}
    </p>
  ) : null;
}

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string | undefined;
  error: FieldErrorLike;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
      <ErrorText id={id} error={error} />
    </div>
  );
}
