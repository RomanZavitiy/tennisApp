"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MatchParty } from "@/lib/generated/prisma/enums";
import {
  matchScoreSchema,
  type MatchScoreInput,
} from "@/lib/validation/match-result";

type FieldErrorLike = { message?: string | undefined } | undefined;
type ActionResult = { ok: true } | { ok: false; message: string };

const MAX_SETS = 3;

// "Submit a result" on /offers/[id] (task 4.6), or "opponent didn't show
// up" (4.10) instead: the checkbox switches the form to that report —
// score and winner stop applying (greyed out via `fieldset disabled`, not
// removed, so re-unchecking doesn't lose anything typed) and the submit
// button calls onNoShow instead of validating and submitting a score. Two
// set rows are always on screen; a third appears only once the first two
// are filled in, since a third set is only legal when they're split (4.5's
// own rule) — the form doesn't stop a player from adding one too early,
// the schema does, with a message next to the sets.
export function ResultForm({
  action,
  onNoShow,
  viewerParty,
  opponentName,
}: {
  action: (values: MatchScoreInput) => Promise<ActionResult>;
  onNoShow: () => Promise<ActionResult>;
  viewerParty: MatchParty;
  opponentName: string;
}) {
  const t = useTranslations("ResultForm");
  const tValidation = useTranslations("Validation.matchResult");
  const [noShow, setNoShow] = useState(false);
  const [noShowPending, setNoShowPending] = useState(false);
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<MatchScoreInput>({
    resolver: zodResolver(matchScoreSchema(tValidation)),
    defaultValues: {
      sets: [
        { author: 0, player: 0 },
        { author: 0, player: 0 },
      ],
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "sets" });

  const authorLabel = viewerParty === "AUTHOR" ? t("you") : opponentName;
  const playerLabel = viewerParty === "PLAYER" ? t("you") : opponentName;

  async function onSubmitScore(values: MatchScoreInput) {
    const result = await action(values);
    if (!result.ok) {
      setError("root", { message: result.message });
    }
  }

  async function onSubmitNoShow() {
    setNoShowPending(true);
    const result = await onNoShow();
    setNoShowPending(false);
    if (!result.ok) {
      setError("root", { message: result.message });
    }
  }

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (noShow) {
          void onSubmitNoShow();
        } else {
          void handleSubmit(onSubmitScore)(event);
        }
      }}
      className="space-y-4"
    >
      <fieldset disabled={noShow} className="space-y-2">
        <legend className="text-sm font-medium">{t("scoreLegend")}</legend>
        <div className="grid grid-cols-[auto_1fr_1fr] items-center gap-2 text-sm">
          <span />
          <span className="text-muted-foreground">{authorLabel}</span>
          <span className="text-muted-foreground">{playerLabel}</span>
          {fields.map((field, index) => (
            <GamesRow
              key={field.id}
              index={index}
              register={register}
              authorGamesAriaLabel={t("gamesAriaLabel", {
                name: authorLabel,
                set: index + 1,
              })}
              playerGamesAriaLabel={t("gamesAriaLabel", {
                name: playerLabel,
                set: index + 1,
              })}
              setLabel={t("setLabel", { set: index + 1 })}
              // A set-level issue (4.5's superRefine) lands on "sets.<index>"
              // itself — not on "author"/"player" — since it's about the
              // pair, not either number on its own.
              error={errors.sets?.[index]}
            />
          ))}
        </div>
        {fields.map((field, index) => {
          const error = errors.sets?.[index];
          return error?.message ? (
            <ErrorText key={field.id} error={error} />
          ) : null;
        })}
        {fields.length < MAX_SETS && (
          <button
            type="button"
            className="text-sm text-muted-foreground underline"
            onClick={() => {
              append({ author: 0, player: 0 });
            }}
          >
            {t("addThirdSet")}
          </button>
        )}
        {fields.length === MAX_SETS && (
          <button
            type="button"
            className="text-sm text-muted-foreground underline"
            onClick={() => {
              remove(MAX_SETS - 1);
            }}
          >
            {t("removeThirdSet")}
          </button>
        )}
      </fieldset>

      <fieldset disabled={noShow} className="space-y-2">
        <legend className="text-sm font-medium">{t("whoWon")}</legend>
        <div className="flex gap-6 text-sm">
          <label className="flex items-center gap-2">
            <input type="radio" value="AUTHOR" {...register("winner")} />
            {authorLabel}
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" value="PLAYER" {...register("winner")} />
            {playerLabel}
          </label>
        </div>
        <ErrorText error={errors.winner} />
      </fieldset>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={noShow}
          onChange={(event) => {
            setNoShow(event.target.checked);
          }}
        />
        {t("opponentNoShow")}
      </label>

      <ErrorText error={errors.root} />

      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting || noShowPending}
      >
        {noShow
          ? noShowPending
            ? t("reporting")
            : t("reportNoShow")
          : isSubmitting
            ? t("submitting")
            : t("submit")}
      </Button>
    </form>
  );
}

function GamesRow({
  index,
  register,
  authorGamesAriaLabel,
  playerGamesAriaLabel,
  setLabel,
  error,
}: {
  index: number;
  register: ReturnType<typeof useForm<MatchScoreInput>>["register"];
  authorGamesAriaLabel: string;
  playerGamesAriaLabel: string;
  setLabel: string;
  error: FieldErrorLike;
}) {
  return (
    <>
      <span className="text-sm text-muted-foreground">{setLabel}</span>
      <Input
        type="number"
        min={0}
        max={30}
        aria-label={authorGamesAriaLabel}
        aria-invalid={error ? true : undefined}
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions -- React Hook Form's path type only accepts a literal number here, not a string
        {...register(`sets.${index}.author`, { valueAsNumber: true })}
      />
      <Input
        type="number"
        min={0}
        max={30}
        aria-label={playerGamesAriaLabel}
        aria-invalid={error ? true : undefined}
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions -- React Hook Form's path type only accepts a literal number here, not a string
        {...register(`sets.${index}.player`, { valueAsNumber: true })}
      />
    </>
  );
}

function ErrorText({ error }: { error: FieldErrorLike }) {
  return error?.message ? (
    <p role="alert" className="text-sm text-destructive">
      {error.message}
    </p>
  ) : null;
}
