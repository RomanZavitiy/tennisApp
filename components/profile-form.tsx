"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { useForm, type FieldError } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Gender } from "@/lib/generated/prisma/enums";
import { DISTRICT_LABELS, NTRP_LEVELS } from "@/lib/profile/options";
import {
  profileSchema,
  type ProfileInput,
  type SaveProfileResult,
} from "@/lib/validation/profile";

// The player profile form, shared by onboarding (empty) and /profile/edit
// (filled in from `defaultValues`).
// Zod checks everything in the browser first; whatever the server action
// still rejects comes back as per-field messages.
export function ProfileForm({
  action,
  submitLabel,
  defaultValues,
}: {
  action: (values: ProfileInput) => Promise<SaveProfileResult>;
  submitLabel: string;
  defaultValues?: ProfileInput;
}) {
  const t = useTranslations("ProfileForm");
  const tGender = useTranslations("Gender");
  const tValidation = useTranslations("Validation.profile");
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema(tValidation)),
    defaultValues,
  });

  async function onSubmit(values: ProfileInput) {
    // On success the action redirects, so only failures come back.
    const result = await action(values);
    for (const [field, message] of Object.entries(result.fieldErrors)) {
      setError(field as keyof ProfileInput, { message });
    }
  }

  return (
    <form
      noValidate
      onSubmit={(event) => void handleSubmit(onSubmit)(event)}
      className="space-y-5"
    >
      <Field id="name" label={t("nameLabel")} error={errors.name}>
        <Input
          id="name"
          autoComplete="given-name"
          {...aria("name", errors.name)}
          {...register("name")}
        />
      </Field>

      <Field
        id="birthDate"
        label={t("birthDateLabel")}
        hint={t("birthDateHint")}
        error={errors.birthDate}
      >
        <Input
          id="birthDate"
          type="date"
          autoComplete="bday"
          {...aria("birthDate", errors.birthDate)}
          {...register("birthDate")}
        />
      </Field>

      <Field id="gender" label={t("genderLabel")} error={errors.gender}>
        <NativeSelect
          id="gender"
          className="w-full"
          // "" keeps the disabled "Choose…" selected on an empty form;
          // without it the browser would preselect the first real option.
          defaultValue={defaultValues?.gender ?? ""}
          {...aria("gender", errors.gender)}
          {...register("gender")}
        >
          <NativeSelectOption value="" disabled>
            {t("choose")}
          </NativeSelectOption>
          {Object.values(Gender).map((value) => (
            <NativeSelectOption key={value} value={value}>
              {tGender(value)}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </Field>

      <Field id="district" label={t("districtLabel")} error={errors.district}>
        <NativeSelect
          id="district"
          className="w-full"
          defaultValue={defaultValues?.district ?? ""}
          {...aria("district", errors.district)}
          {...register("district")}
        >
          <NativeSelectOption value="" disabled>
            {t("choose")}
          </NativeSelectOption>
          {Object.entries(DISTRICT_LABELS).map(([value, label]) => (
            <NativeSelectOption key={value} value={value}>
              {label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </Field>

      <Field
        id="selfRatedNtrp"
        label={t("levelLabel")}
        hint={t("levelHint")}
        error={errors.selfRatedNtrp}
      >
        <NativeSelect
          id="selfRatedNtrp"
          className="w-full"
          defaultValue={defaultValues?.selfRatedNtrp ?? ""}
          {...aria("selfRatedNtrp", errors.selfRatedNtrp)}
          {...register("selfRatedNtrp", { valueAsNumber: true })}
        >
          <NativeSelectOption value="" disabled>
            {t("choose")}
          </NativeSelectOption>
          {NTRP_LEVELS.map((level) => (
            <NativeSelectOption key={level} value={level}>
              {level.toFixed(1)}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </Field>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? t("saving") : submitLabel}
      </Button>
    </form>
  );
}

function aria(id: string, error: FieldError | undefined) {
  return {
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : undefined,
  };
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
  hint?: string;
  error: FieldError | undefined;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
          {error.message}
        </p>
      )}
    </div>
  );
}
