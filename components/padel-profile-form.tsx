"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { updatePadelProfile } from "@/app/(member)/profile/padel/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { PadelSide } from "@/lib/generated/prisma/enums";
import { PADEL_LEVELS } from "@/lib/sport/sport";
import type { PadelProfile } from "@/lib/validation/padel-profile";

/**
 * "My padel" (slice PD2): level 1–7 and the preferred side, saved together.
 * Both optional — "I don't play padel" clears the level, and the side with
 * it (lib/validation/padel-profile.ts does the same on the server).
 */
export function PadelProfileForm({ padel }: { padel: PadelProfile }) {
  const t = useTranslations("PadelProfileForm");
  const tSide = useTranslations("PadelSide");
  const [level, setLevel] = useState(padel.padelLevel);
  const [side, setSide] = useState(padel.padelSide);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function save() {
    setMessage(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updatePadelProfile({
        padelLevel: level,
        padelSide: level === null ? null : side,
      });
      if (result.ok) {
        setSaved(true);
      } else {
        setMessage(result.message);
      }
    });
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="padelLevel">{t("levelLabel")}</Label>
        <NativeSelect
          id="padelLevel"
          className="w-full"
          value={level === null ? "" : String(level)}
          onChange={(event) => {
            setSaved(false);
            setLevel(
              event.target.value === "" ? null : Number(event.target.value),
            );
          }}
        >
          <NativeSelectOption value="">{t("noLevel")}</NativeSelectOption>
          {PADEL_LEVELS.map((option) => (
            <NativeSelectOption key={option} value={String(option)}>
              {option.toFixed(1)}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <p className="text-sm text-muted-foreground">{t("levelHint")}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="padelSide">{t("sideLabel")}</Label>
        <NativeSelect
          id="padelSide"
          className="w-full"
          disabled={level === null}
          value={level === null ? "" : (side ?? "")}
          onChange={(event) => {
            setSaved(false);
            setSide(
              event.target.value === ""
                ? null
                : (event.target.value as PadelSide),
            );
          }}
        >
          <NativeSelectOption value="">{t("noSide")}</NativeSelectOption>
          {Object.values(PadelSide).map((option) => (
            <NativeSelectOption key={option} value={option}>
              {tSide(option)}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>

      <Button type="button" disabled={pending} onClick={save}>
        {pending ? t("saving") : saved ? t("saved") : t("save")}
      </Button>
      {message && (
        <p role="alert" className="text-sm text-destructive">
          {message}
        </p>
      )}
    </div>
  );
}
