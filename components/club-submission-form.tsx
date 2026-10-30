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
import { DISTRICT_LABELS } from "@/lib/profile/options";
import {
  clubSubmissionSchema,
  NOTES_MAX,
  type ClubSubmissionInput,
  type SubmitClubResult,
} from "@/lib/validation/club-submission";

// Fields whose schema starts with z.preprocess are typed `unknown` on input,
// and React Hook Form widens their errors; only the message matters here.
type FieldErrorLike = { message?: string | undefined } | undefined;

// The /clubs/suggest form (task M.5), same shape as OfferForm/ProfileForm:
// Zod checks everything in the browser first; whatever submitClub() still
// rejects comes back as per-field messages. There's no page to redirect to
// on success (unlike OfferForm) — the form switches to a "thanks" message
// instead, same pattern as ReportForm's `done` state.
export function ClubSubmissionForm({
  action,
}: {
  action: (values: ClubSubmissionInput) => Promise<SubmitClubResult>;
}) {
  const t = useTranslations("ClubSubmissionForm");
  const tValidation = useTranslations("Validation.clubSubmission");
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ClubSubmissionInput>({
    resolver: zodResolver(clubSubmissionSchema(tValidation), undefined, {
      raw: true,
    }),
    defaultValues: { name: "", address: "", districtGuess: "", notes: "" },
  });

  if (done) {
    return <p className="text-sm text-muted-foreground">{t("thanks")}</p>;
  }

  async function onSubmit(values: ClubSubmissionInput) {
    const result = await action(values);
    if (result.ok) {
      setDone(true);
      return;
    }
    for (const [field, message] of Object.entries(result.fieldErrors)) {
      setError(field as keyof ClubSubmissionInput, { message });
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
      <Field id="name" label={t("nameLabel")} error={errors.name}>
        <Input id="name" {...aria("name", errors.name)} {...register("name")} />
      </Field>

      <Field id="address" label={t("addressLabel")} error={errors.address}>
        <Input
          id="address"
          {...aria("address", errors.address)}
          {...register("address")}
        />
      </Field>

      <Field
        id="districtGuess"
        label={t("districtLabel")}
        hint={t("districtHint")}
        error={errors.districtGuess}
      >
        <NativeSelect
          id="districtGuess"
          className="w-full"
          {...aria("districtGuess", errors.districtGuess)}
          {...register("districtGuess")}
        >
          <NativeSelectOption value="">
            {t("districtUnknown")}
          </NativeSelectOption>
          {Object.entries(DISTRICT_LABELS).map(([value, label]) => (
            <NativeSelectOption key={value} value={value}>
              {label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </Field>

      <Field
        id="notes"
        label={t("notesLabel")}
        hint={t("notesHint", { max: NOTES_MAX })}
        error={errors.notes}
      >
        <Textarea
          id="notes"
          rows={3}
          {...aria("notes", errors.notes)}
          {...register("notes")}
        />
      </Field>

      <ErrorText id="root" error={errors.root} />

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? t("sending") : t("submit")}
      </Button>
    </form>
  );
}

function aria(id: string, error: FieldErrorLike) {
  return {
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : undefined,
  };
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
