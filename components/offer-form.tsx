"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { ComponentProps, ReactNode } from "react";
import { useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { SURFACE_LABELS } from "@/lib/clubs/surface-labels";
import type { District } from "@/lib/generated/prisma/enums";
import { DISTRICT_LABELS, NTRP_LEVELS } from "@/lib/profile/options";
import {
  COMMENT_MAX,
  offerSchema,
  type CreateOfferResult,
  type OfferInput,
} from "@/lib/validation/offer";

// Fields whose schema starts with z.preprocess are typed `unknown` on input,
// and React Hook Form widens their errors; only the message matters here.
type FieldErrorLike = { message?: string | undefined } | undefined;

export type ClubOption = {
  id: string;
  name: string;
  district: District | null;
};

// The /offers/new form (task 3.5). Zod checks everything in the browser
// first; whatever the server action still rejects comes back as per-field
// messages. `raw: true` hands the action what the player entered — the
// action parses it again itself (3.4), so it must get the Kraków time
// string, not the Date the schema turns it into.
export function OfferForm({
  action,
  clubs,
  defaultDistrict,
  earliestStart,
}: {
  action: (values: OfferInput) => Promise<CreateOfferResult>;
  clubs: ClubOption[];
  defaultDistrict: District;
  /** Kraków time now, "YYYY-MM-DDTHH:mm": the picker's lower bound. */
  earliestStart: string;
}) {
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<OfferInput>({
    resolver: zodResolver(offerSchema, undefined, { raw: true }),
    defaultValues: {
      format: "SINGLES",
      startsAt: "",
      clubId: "",
      district: defaultDistrict,
      ntrpMin: "",
      ntrpMax: "",
      surface: "",
      comment: "",
    },
  });
  const isDoubles = useWatch({ control, name: "format" }) === "DOUBLES";
  const clubId = useWatch({ control, name: "clubId" });
  const club = clubs.find((c) => c.id === clubId);

  async function onSubmit(values: OfferInput) {
    // On success the action redirects, so only failures come back.
    const result = await action(values);
    for (const [field, message] of Object.entries(result.fieldErrors)) {
      setError(field as keyof OfferInput, { message });
    }
  }

  // An empty select means "any level"; a chosen one is a number.
  const ntrpValue = (value: unknown) =>
    value === "" ? undefined : Number(value);

  return (
    <form
      noValidate
      onSubmit={(event) => void handleSubmit(onSubmit)(event)}
      className="space-y-5"
    >
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Format</legend>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" value="SINGLES" {...register("format")} />
            Singles
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" value="DOUBLES" {...register("format")} />
            Doubles
          </label>
        </div>
        {isDoubles && (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              {...aria("hasPartner", errors.hasPartner)}
              // Leaves the form's values when the box disappears, so
              // switching back to singles can't send a stale partner.
              {...register("hasPartner", { shouldUnregister: true })}
            />
            I already have a partner
          </label>
        )}
        <ErrorText id="hasPartner" error={errors.hasPartner} />
      </fieldset>

      <Field id="startsAt" label="Start time" error={errors.startsAt}>
        <Input
          id="startsAt"
          type="datetime-local"
          min={earliestStart}
          {...aria("startsAt", errors.startsAt)}
          {...register("startsAt")}
        />
      </Field>

      <Field id="clubId" label="Club" error={errors.clubId}>
        <NativeSelect
          id="clubId"
          className="w-full"
          {...aria("clubId", errors.clubId)}
          {...register("clubId", {
            // A club decides the district; the server does the same (3.4).
            onChange: (event: { target: { value: string } }) => {
              const chosen = clubs.find((c) => c.id === event.target.value);
              if (chosen) {
                setValue("district", chosen.district ?? "");
              }
            },
          })}
        >
          <NativeSelectOption value="">No specific club</NativeSelectOption>
          {clubs.map((club) => (
            <NativeSelectOption key={club.id} value={club.id}>
              {club.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </Field>

      <Field
        id="district"
        label="District"
        hint={
          club &&
          (club.district
            ? "Taken from the club."
            : "This club is outside the city, so it has no district.")
        }
        error={errors.district}
      >
        <NativeSelect
          id="district"
          className="w-full"
          {...aria("district", errors.district)}
          {...register("district")}
        >
          <NativeSelectOption value="">Choose…</NativeSelectOption>
          {Object.entries(DISTRICT_LABELS).map(([value, label]) => (
            <NativeSelectOption key={value} value={value}>
              {label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field id="ntrpMin" label="Level from (NTRP)" error={errors.ntrpMin}>
          <NtrpSelect
            id="ntrpMin"
            error={errors.ntrpMin}
            {...register("ntrpMin", { setValueAs: ntrpValue })}
          />
        </Field>
        <Field id="ntrpMax" label="Level to (NTRP)" error={errors.ntrpMax}>
          <NtrpSelect
            id="ntrpMax"
            error={errors.ntrpMax}
            {...register("ntrpMax", { setValueAs: ntrpValue })}
          />
        </Field>
      </div>

      <Field id="surface" label="Surface" error={errors.surface}>
        <NativeSelect
          id="surface"
          className="w-full"
          {...aria("surface", errors.surface)}
          {...register("surface")}
        >
          <NativeSelectOption value="">Any surface</NativeSelectOption>
          {Object.entries(SURFACE_LABELS).map(([value, label]) => (
            <NativeSelectOption key={value} value={value}>
              {label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </Field>

      <Field
        id="comment"
        label="Comment"
        hint={`Optional, up to ${String(COMMENT_MAX)} characters.`}
        error={errors.comment}
      >
        <Textarea
          id="comment"
          rows={3}
          {...aria("comment", errors.comment)}
          {...register("comment")}
        />
      </Field>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Posting…" : "Post offer"}
      </Button>
    </form>
  );
}

function NtrpSelect({
  id,
  error,
  ...props
}: { id: string; error: FieldErrorLike } & ComponentProps<
  typeof NativeSelect
>) {
  return (
    <NativeSelect id={id} className="w-full" {...aria(id, error)} {...props}>
      <NativeSelectOption value="">Any</NativeSelectOption>
      {NTRP_LEVELS.map((level) => (
        <NativeSelectOption key={level} value={level}>
          {level.toFixed(1)}
        </NativeSelectOption>
      ))}
    </NativeSelect>
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
