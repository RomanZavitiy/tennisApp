"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MatchParty } from "@/lib/generated/prisma/enums";
import {
  matchScoreSchema,
  type MatchScoreInput,
} from "@/lib/validation/match-result";

type FieldErrorLike = { message?: string | undefined } | undefined;

const MAX_SETS = 3;

// "Submit a result" on /offers/[id] (task 4.6). Two set rows are always on
// screen; a third appears only once the first two are filled in, since a
// third set is only legal when they're split (4.5's own rule) — the form
// doesn't stop a player from adding one too early, the schema does, with a
// message next to the sets.
export function ResultForm({
  action,
  viewerParty,
  opponentName,
}: {
  action: (
    values: MatchScoreInput,
  ) => Promise<{ ok: true } | { ok: false; message: string }>;
  viewerParty: MatchParty;
  opponentName: string;
}) {
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<MatchScoreInput>({
    resolver: zodResolver(matchScoreSchema),
    defaultValues: {
      sets: [
        { author: 0, player: 0 },
        { author: 0, player: 0 },
      ],
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "sets" });

  const authorLabel = viewerParty === "AUTHOR" ? "You" : opponentName;
  const playerLabel = viewerParty === "PLAYER" ? "You" : opponentName;

  async function onSubmit(values: MatchScoreInput) {
    const result = await action(values);
    if (!result.ok) {
      setError("root", { message: result.message });
    }
  }

  return (
    <form
      noValidate
      onSubmit={(event) => void handleSubmit(onSubmit)(event)}
      className="space-y-4"
    >
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Score</legend>
        <div className="grid grid-cols-[auto_1fr_1fr] items-center gap-2 text-sm">
          <span />
          <span className="text-muted-foreground">{authorLabel}</span>
          <span className="text-muted-foreground">{playerLabel}</span>
          {fields.map((field, index) => (
            <GamesRow
              key={field.id}
              index={index}
              register={register}
              authorLabel={authorLabel}
              playerLabel={playerLabel}
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
            + Add a third set
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
            Remove third set
          </button>
        )}
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Who won?</legend>
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

      {/* TODO(session 05, task 4.10): wire this up to a NO_SHOW result
          instead of the score form. Disabled for now so the layout doesn't
          have to change again once it works. */}
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input type="checkbox" disabled title="Coming soon" />
        Opponent didn&apos;t show up
      </label>

      <ErrorText error={errors.root} />

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Submitting…" : "Submit result"}
      </Button>
    </form>
  );
}

function GamesRow({
  index,
  register,
  authorLabel,
  playerLabel,
  error,
}: {
  index: number;
  register: ReturnType<typeof useForm<MatchScoreInput>>["register"];
  authorLabel: string;
  playerLabel: string;
  error: FieldErrorLike;
}) {
  const setNumber = String(index + 1);
  return (
    <>
      <span className="text-sm text-muted-foreground">Set {setNumber}</span>
      <Input
        type="number"
        min={0}
        max={30}
        aria-label={`${authorLabel}'s games, set ${setNumber}`}
        aria-invalid={error ? true : undefined}
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions -- React Hook Form's path type only accepts a literal number here, not a string
        {...register(`sets.${index}.author`, { valueAsNumber: true })}
      />
      <Input
        type="number"
        min={0}
        max={30}
        aria-label={`${playerLabel}'s games, set ${setNumber}`}
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
