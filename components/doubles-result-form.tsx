"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import {
  submitDoublesNoShow,
  submitDoublesResult,
} from "@/app/offers/[id]/doubles-result-actions";
import { ResultForm } from "@/components/result-form";
import { Button } from "@/components/ui/button";
import type { MatchParty } from "@/lib/generated/prisma/enums";
import type { DoublesPlayer } from "@/lib/offers/doubles-details";
import type { MatchScoreInput } from "@/lib/validation/match-result";

// "Submit result" for a doubles game (slice PD4): first who played with the
// author — the one choice that fixes both pairs — then the same score form
// as singles, with the pairs' names over the columns. Or, instead, "someone
// didn't show up" with the one player it was. With hasPartner the pairs are
// already known: the author and their own partner against the two others.

export function DoublesResultForm({
  offerId,
  viewerId,
  players,
  hasPartner,
}: {
  offerId: string;
  viewerId: string;
  /** The author first, then the accepted players. */
  players: DoublesPlayer[];
  hasPartner: boolean;
}) {
  const t = useTranslations("DoublesResult");
  const [author, ...others] = players;
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [mode, setMode] = useState<"score" | "noShow">("score");

  const nameOf = (player: DoublesPlayer) =>
    player.id === viewerId ? t("you") : (player.name ?? t("aPlayer"));
  const pairsKnown = hasPartner || partnerId !== null;
  const authorPair = hasPartner
    ? [nameOf(author), t("authorsPartner")]
    : [author, ...others.filter((p) => p.id === partnerId)].map(nameOf);
  const otherPair = others
    .filter((player) => player.id !== partnerId)
    .map(nameOf);
  const viewerSide: MatchParty =
    viewerId === author.id || viewerId === partnerId ? "AUTHOR" : "PLAYER";

  return (
    <div className="space-y-4">
      <div className="flex gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            checked={mode === "score"}
            onChange={() => {
              setMode("score");
            }}
          />
          {t("modeScore")}
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            checked={mode === "noShow"}
            onChange={() => {
              setMode("noShow");
            }}
          />
          {t("modeNoShow")}
        </label>
      </div>

      {mode === "noShow" ? (
        <NoShowForm
          offerId={offerId}
          candidates={players.filter((player) => player.id !== viewerId)}
          nameOf={nameOf}
        />
      ) : (
        <>
          {!hasPartner && (
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">
                {t("whoPlayedWith", { name: nameOf(author) })}
              </legend>
              <div className="flex flex-wrap gap-4 text-sm">
                {others.map((player) => (
                  <label key={player.id} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="authorPartner"
                      checked={partnerId === player.id}
                      onChange={() => {
                        setPartnerId(player.id);
                      }}
                    />
                    {nameOf(player)}
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          {pairsKnown && (
            <ResultForm
              // A new pair choice starts the score over: the columns changed.
              key={partnerId ?? "partner"}
              action={(values: MatchScoreInput) =>
                submitDoublesResult(offerId, {
                  ...values,
                  authorPartnerId: hasPartner ? null : partnerId,
                })
              }
              viewerParty={viewerSide}
              opponentName=""
              sideLabels={{
                author: authorPair.join(" & "),
                player: otherPair.join(" & "),
              }}
            />
          )}
        </>
      )}
    </div>
  );
}

function NoShowForm({
  offerId,
  candidates,
  nameOf,
}: {
  offerId: string;
  candidates: DoublesPlayer[];
  nameOf: (player: DoublesPlayer) => string;
}) {
  const t = useTranslations("DoublesResult");
  const [noShowId, setNoShowId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (!noShowId) {
          setError(t("pickWhoDidntCome"));
          return;
        }
        setError(null);
        startTransition(async () => {
          const result = await submitDoublesNoShow(offerId, noShowId);
          if (!result.ok) {
            setError(result.message);
          }
        });
      }}
    >
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">{t("whoDidntCome")}</legend>
        <div className="flex flex-wrap gap-4 text-sm">
          {candidates.map((player) => (
            <label key={player.id} className="flex items-center gap-2">
              <input
                type="radio"
                name="noShow"
                checked={noShowId === player.id}
                onChange={() => {
                  setNoShowId(player.id);
                }}
              />
              {nameOf(player)}
            </label>
          ))}
        </div>
      </fieldset>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? t("reporting") : t("reportNoShow")}
      </Button>
    </form>
  );
}
