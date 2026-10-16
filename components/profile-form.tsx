"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import Link from "next/link";
import type { ReactNode } from "react";
import { useForm, type FieldError } from "react-hook-form";
import { z } from "zod";

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

// agreeToTerms only exists when `withConsent` renders it (onboarding, task
// 6.11/6.12) — kept out of ProfileInput/profileSchema itself so /profile/edit
// never has to carry a field it has no use for; `updateProfile`'s plain
// profileSchema silently ignores it if present (Zod's default "strip" mode).
type ProfileFormValues = ProfileInput & { agreeToTerms?: boolean };

// The player profile form, shared by onboarding (empty) and /profile/edit
// (filled in from `defaultValues`).
// Zod checks everything in the browser first; whatever the server action
// still rejects comes back as per-field messages.
export function ProfileForm({
  action,
  submitLabel,
  defaultValues,
  withConsent = false,
}: {
  action: (values: ProfileInput) => Promise<SaveProfileResult>;
  submitLabel: string;
  defaultValues?: ProfileInput;
  /** Onboarding only: adds the required "I agree to Terms/Privacy" checkbox. */
  withConsent?: boolean;
}) {
  const t = useTranslations("ProfileForm");
  const tGender = useTranslations("Gender");
  const tValidation = useTranslations("Validation.profile");
  const schema = withConsent
    ? profileSchema(tValidation).extend({
        agreeToTerms: z.literal(true, tValidation("agreeRequired")),
      })
    : profileSchema(tValidation);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  async function onSubmit(values: ProfileFormValues) {
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

      {withConsent && (
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <input
              id="agreeToTerms"
              type="checkbox"
              className="mt-1"
              {...aria("agreeToTerms", errors.agreeToTerms)}
              {...register("agreeToTerms")}
            />
            <Label htmlFor="agreeToTerms" className="font-normal">
              {t.rich("agreeToTerms", {
                terms: (chunks) => (
                  <Link
                    href="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    {chunks}
                  </Link>
                ),
                privacy: (chunks) => (
                  <Link
                    href="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    {chunks}
                  </Link>
                ),
              })}
            </Label>
          </div>
          {errors.agreeToTerms && (
            <p
              id="agreeToTerms-error"
              role="alert"
              className="text-sm text-destructive"
            >
              {errors.agreeToTerms.message}
            </p>
          )}
        </div>
      )}

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
