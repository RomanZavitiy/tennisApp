"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { ReactNode } from "react";
import { useForm, type FieldError } from "react-hook-form";

import type { SaveProfileResult } from "@/app/onboarding/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  DISTRICT_LABELS,
  GENDER_LABELS,
  NTRP_LEVELS,
} from "@/lib/profile/options";
import { profileSchema, type ProfileInput } from "@/lib/validation/profile";

// The player profile form: onboarding now, profile editing in task 1.15.
// Zod checks everything in the browser first; whatever the server action
// still rejects comes back as per-field messages.
export function ProfileForm({
  action,
  submitLabel,
}: {
  action: (values: ProfileInput) => Promise<SaveProfileResult>;
  submitLabel: string;
}) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProfileInput>({ resolver: zodResolver(profileSchema) });

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
      <Field id="name" label="Name" error={errors.name}>
        <Input
          id="name"
          autoComplete="given-name"
          {...aria("name", errors.name)}
          {...register("name")}
        />
      </Field>

      <Field
        id="birthDate"
        label="Date of birth"
        hint="Only your age is shown to other players."
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

      <Field id="gender" label="Gender" error={errors.gender}>
        <NativeSelect
          id="gender"
          className="w-full"
          defaultValue=""
          {...aria("gender", errors.gender)}
          {...register("gender")}
        >
          <NativeSelectOption value="" disabled>
            Choose…
          </NativeSelectOption>
          {Object.entries(GENDER_LABELS).map(([value, label]) => (
            <NativeSelectOption key={value} value={value}>
              {label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </Field>

      <Field id="district" label="District" error={errors.district}>
        <NativeSelect
          id="district"
          className="w-full"
          defaultValue=""
          {...aria("district", errors.district)}
          {...register("district")}
        >
          <NativeSelectOption value="" disabled>
            Choose…
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
        label="Level (NTRP)"
        hint="1.5 is a beginner, 4.0 a solid club player, 7.0 a touring pro."
        error={errors.selfRatedNtrp}
      >
        <NativeSelect
          id="selfRatedNtrp"
          className="w-full"
          defaultValue=""
          {...aria("selfRatedNtrp", errors.selfRatedNtrp)}
          {...register("selfRatedNtrp", { valueAsNumber: true })}
        >
          <NativeSelectOption value="" disabled>
            Choose…
          </NativeSelectOption>
          {NTRP_LEVELS.map((level) => (
            <NativeSelectOption key={level} value={level}>
              {level.toFixed(1)}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </Field>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : submitLabel}
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
