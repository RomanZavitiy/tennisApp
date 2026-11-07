"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import type { FeedbackTag, LevelSignal } from "@/lib/generated/prisma/enums";

type FeedbackActionResult = { ok: true } | { ok: false; message: string };

const TAGS: FeedbackTag[] = ["PUNCTUAL", "LEVEL_MATCHES_NTRP", "GOOD_GAME"];
const LEVEL_SIGNALS: LevelSignal[] = ["HIGHER", "LOWER"];

function toggled<T>(list: readonly T[], value: T): T[] {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

/**
 * "Rate your opponent" (task W.1): up to 3 optional tags plus an optional
 * level signal, no free text (owner decision 2026-11-07). `action` already
 * has the match bound to it (`submitFeedback.bind(null, matchResultId)`),
 * same idiom as ReportButton binding its target.
 */
export function RateOpponentForm({
  action,
}: {
  action: (input: {
    tags: FeedbackTag[];
    levelSignal: LevelSignal | null;
  }) => Promise<FeedbackActionResult>;
}) {
  const t = useTranslations("RateOpponentForm");
  const tTag = useTranslations("FeedbackTag");
  const tLevelSignal = useTranslations("LevelSignal");
  const [tags, setTags] = useState<FeedbackTag[]>([]);
  const [levelSignal, setLevelSignal] = useState<LevelSignal | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  if (done) {
    return <p className="text-sm text-muted-foreground">{t("done")}</p>;
  }

  return (
    <form
      className="mt-2 space-y-3 rounded-lg border bg-muted/40 p-3"
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        startTransition(async () => {
          const result = await action({ tags, levelSignal });
          if (result.ok) {
            setDone(true);
          } else {
            setError(result.message);
          }
        });
      }}
    >
      <fieldset className="space-y-1.5">
        <legend className="text-sm font-medium">{t("tagsLabel")}</legend>
        {TAGS.map((tag) => (
          <label key={tag} className="flex items-center gap-1.5 text-sm">
            <input
              type="checkbox"
              checked={tags.includes(tag)}
              onChange={() => {
                setTags(toggled(tags, tag));
              }}
            />
            {tTag(tag)}
          </label>
        ))}
      </fieldset>
      <fieldset className="space-y-1.5">
        <legend className="text-sm font-medium">{t("levelSignalLabel")}</legend>
        <label className="flex items-center gap-1.5 text-sm">
          <input
            type="radio"
            name="levelSignal"
            checked={levelSignal === null}
            onChange={() => {
              setLevelSignal(null);
            }}
          />
          {t("levelSignalNone")}
        </label>
        {LEVEL_SIGNALS.map((signal) => (
          <label key={signal} className="flex items-center gap-1.5 text-sm">
            <input
              type="radio"
              name="levelSignal"
              checked={levelSignal === signal}
              onChange={() => {
                setLevelSignal(signal);
              }}
            />
            {tLevelSignal(signal)}
          </label>
        ))}
      </fieldset>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
