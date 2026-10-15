"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
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
import type { District } from "@/lib/generated/prisma/enums";
import { CourtStatus, Surface } from "@/lib/generated/prisma/enums";
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
  defaultClubId,
  earliestStart,
}: {
  action: (values: OfferInput) => Promise<CreateOfferResult>;
  clubs: ClubOption[];
  defaultDistrict: District;
  /** Pre-selected from "Create an offer at this club" (task 2.10). */
  defaultClubId?: string;
  /** Kraków time now, "YYYY-MM-DDTHH:mm": the picker's lower bound. */
  earliestStart: string;
}) {
  const t = useTranslations("OfferForm");
  const tSurface = useTranslations("Surface");
  const tCourtStatus = useTranslations("CourtStatus");
  const tValidation = useTranslations("Validation.offer");
  const presetClub = clubs.find((c) => c.id === defaultClubId);
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<OfferInput>({
    resolver: zodResolver(offerSchema(tValidation), undefined, { raw: true }),
    defaultValues: {
      format: "SINGLES",
      startsAt: "",
      clubId: presetClub?.id ?? "",
      // A preset club decides the district, same as picking one below.
      district: presetClub
        ? (presetClub.district ?? undefined)
        : defaultDistrict,
      ntrpMin: "",
      ntrpMax: "",
      surface: "",
      courtStatus: "WILL_BOOK",
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
    // A refusal that isn't about one field — blocked, or over a limit (6.4,
    // 6.16-6.18).
    if (result.message) {
      setError("root", { message: result.message });
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
        <legend className="text-sm font-medium">{t("formatLabel")}</legend>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" value="SINGLES" {...register("format")} />
            {t("singles")}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" value="DOUBLES" {...register("format")} />
            {t("doubles")}
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
            {t("hasPartner")}
          </label>
        )}
        <ErrorText id="hasPartner" error={errors.hasPartner} />
      </fieldset>

      <Field id="startsAt" label={t("startsAtLabel")} error={errors.startsAt}>
        <Input
          id="startsAt"
          type="datetime-local"
          min={earliestStart}
          {...aria("startsAt", errors.startsAt)}
          {...register("startsAt")}
        />
      </Field>

      <Field id="clubId" label={t("clubLabel")} error={errors.clubId}>
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
          <NativeSelectOption value="">
            {t("noSpecificClub")}
          </NativeSelectOption>
          {clubs.map((club) => (
            <NativeSelectOption key={club.id} value={club.id}>
              {club.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </Field>

      <Field
        id="district"
        label={t("districtLabel")}
        hint={
          club
            ? club.district
              ? t("districtFromClub")
              : t("districtOutsideCity")
            : undefined
        }
        error={errors.district}
      >
        <NativeSelect
          id="district"
          className="w-full"
          {...aria("district", errors.district)}
          {...register("district")}
        >
          <NativeSelectOption value="">{t("choose")}</NativeSelectOption>
          {Object.entries(DISTRICT_LABELS).map(([value, label]) => (
            <NativeSelectOption key={value} value={value}>
              {label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field id="ntrpMin" label={t("levelFromLabel")} error={errors.ntrpMin}>
          <NtrpSelect
            id="ntrpMin"
            error={errors.ntrpMin}
            anyLabel={t("anyLevel")}
            {...register("ntrpMin", { setValueAs: ntrpValue })}
          />
        </Field>
        <Field id="ntrpMax" label={t("levelToLabel")} error={errors.ntrpMax}>
          <NtrpSelect
            id="ntrpMax"
            error={errors.ntrpMax}
            anyLabel={t("anyLevel")}
            {...register("ntrpMax", { setValueAs: ntrpValue })}
          />
        </Field>
      </div>

      <Field id="surface" label={t("surfaceLabel")} error={errors.surface}>
        <NativeSelect
          id="surface"
          className="w-full"
          {...aria("surface", errors.surface)}
          {...register("surface")}
        >
          <NativeSelectOption value="">{t("anySurface")}</NativeSelectOption>
          {Object.values(Surface).map((value) => (
            <NativeSelectOption key={value} value={value}>
              {tSurface(value)}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </Field>

      <Field
        id="courtStatus"
        label={t("courtLabel")}
        error={errors.courtStatus}
      >
        <NativeSelect
          id="courtStatus"
          className="w-full"
          {...aria("courtStatus", errors.courtStatus)}
          {...register("courtStatus")}
        >
          {Object.values(CourtStatus).map((value) => (
            <NativeSelectOption key={value} value={value}>
              {tCourtStatus(value)}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </Field>

      <Field
        id="comment"
        label={t("commentLabel")}
        hint={t("commentHint", { max: COMMENT_MAX })}
        error={errors.comment}
      >
        <Textarea
          id="comment"
          rows={3}
          {...aria("comment", errors.comment)}
          {...register("comment")}
        />
      </Field>

      <ErrorText id="root" error={errors.root} />

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? t("posting") : t("submit")}
      </Button>
    </form>
  );
}

function NtrpSelect({
  id,
  error,
  anyLabel,
  ...props
}: { id: string; error: FieldErrorLike; anyLabel: string } & ComponentProps<
  typeof NativeSelect
>) {
  return (
    <NativeSelect id={id} className="w-full" {...aria(id, error)} {...props}>
      <NativeSelectOption value="">{anyLabel}</NativeSelectOption>
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
