import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getFormatter, getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import {
  acceptJoin,
  cancelOffer,
  declineJoin,
  requestToJoin,
  withdrawJoin,
} from "@/app/offers/[id]/actions";
import { reportOffer } from "@/app/offers/[id]/report-actions";
import {
  confirmResult,
  disputeResult,
  submitNoShow,
  submitResult,
} from "@/app/offers/[id]/result-actions";
import { JoinThread } from "@/components/join-thread";
import { MarkMeaningfulAction } from "@/components/mark-meaningful-action";
import { OfferActionButton } from "@/components/offer-action-button";
import { OfferBookingSection } from "@/components/offer-booking-section";
import { PlayerAvatar } from "@/components/player-avatar";
import { ReportButton } from "@/components/report-button";
import { ResultForm } from "@/components/result-form";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/require-user";
import type { MatchParty, OfferFormat } from "@/lib/generated/prisma/enums";
import { canCancelOffer } from "@/lib/offers/cancel-rules";
import { joinRefusal } from "@/lib/offers/join-rules";
import { formatKrakowTime } from "@/lib/offers/krakow-time";
import {
  getOfferDetails,
  type OfferDetails,
  type OfferJoinResult,
  type OfferPlayer,
} from "@/lib/offers/offer-details";
import {
  formatLabel,
  levelLabel,
  placeLabel,
  spotsLabel,
} from "@/lib/offers/offer-labels";
import { eloChangeLabel, formatScoreFor } from "@/lib/offers/result-labels";
import { DISTRICT_LABELS } from "@/lib/profile/options";
import { reliabilityLabel } from "@/lib/rating/reliability";
import type { SetScore } from "@/lib/validation/match-result";

// An offer's page (task 3.13), public. A guest sees the details and a sign-in
// link; a player sees their request and what they can do with it; the
// author sees the requests with accept/decline and the free places. Which
// buttons appear is only a convenience — every action checks again (3.11,
// 3.12).

// Typed by hand, like /players/[id]: generated PageProps need `next typegen`.
type OfferPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("OfferPage");
  return { title: t("title") };
}

export default async function OfferPage({
  params,
  searchParams,
}: OfferPageProps) {
  // Requests change the page all the time; never serve a cached one.
  await connection();
  const { id } = await params;
  // createOffer (3.4) redirects here with ?created=1 — "the first offer
  // created" (task 5.15), flagged client-side below.
  const { created } = await searchParams;
  const viewer = await getCurrentUser();
  const details = await getOfferDetails(id, viewer?.id ?? null);
  if (!details) {
    notFound();
  }
  const { offer } = details;
  const started = offer.startsAt <= new Date();

  const t = await getTranslations("OfferPage");
  const tOfferLabels = await getTranslations("OfferLabels");
  const tSurface = await getTranslations("Surface");
  const tCourtStatus = await getTranslations("CourtStatus");
  const format = await getFormatter();

  const facts = [
    {
      label: t("whereLabel"),
      value: placeLabel(
        offer,
        offer.district ? DISTRICT_LABELS[offer.district] : null,
      ),
    },
    {
      label: t("levelLabel"),
      value: levelLabel(tOfferLabels, offer.ntrpMin, offer.ntrpMax),
    },
    ...(offer.surface
      ? [{ label: t("surfaceLabel"), value: tSurface(offer.surface) }]
      : []),
    { label: t("courtLabel"), value: tCourtStatus(offer.courtStatus) },
  ];

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 py-10">
      {created === "1" && <MarkMeaningfulAction />}
      <p className="text-sm text-muted-foreground">
        {formatLabel(tOfferLabels, offer)}
      </p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">
        <time dateTime={offer.startsAt.toISOString()}>
          {formatKrakowTime(format, offer.startsAt)}
        </time>
      </h1>
      <p className="mt-2 font-medium text-primary">
        {offer.status === "CANCELLED"
          ? t("statusCancelled")
          : started
            ? t("statusStarted")
            : spotsLabel(tOfferLabels, details.spotsLeft)}
      </p>

      <dl className="mt-6 space-y-3">
        {facts.map((fact) => (
          <div key={fact.label} className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{fact.label}</dt>
            <dd className="text-right font-medium">{fact.value}</dd>
          </div>
        ))}
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">{t("postedBy")}</dt>
          <dd className="text-right font-medium">
            <PlayerLink player={offer.author} />
          </dd>
        </div>
      </dl>
      {offer.club && (
        <OfferBookingSection
          offerId={offer.id}
          club={offer.club}
          isAuthor={details.isAuthor}
          courtStatus={offer.courtStatus}
        />
      )}
      {offer.comment && (
        <p className="mt-6 whitespace-pre-line">{offer.comment}</p>
      )}

      <section className="mt-8">
        {!viewer ? (
          <Link
            href={`/login?next=${encodeURIComponent(`/offers/${offer.id}`)}`}
            className={buttonVariants()}
          >
            {t("signInToJoin")}
          </Link>
        ) : details.isAuthor ? (
          <AuthorView
            details={details}
            started={started}
            viewerId={viewer.id}
          />
        ) : (
          <PlayerView details={details} viewerId={viewer.id} />
        )}
      </section>
      {viewer && !details.isAuthor && (
        <section className="mt-6">
          <ReportButton
            action={reportOffer.bind(null, offer.id)}
            label={t("reportThisOffer")}
          />
        </section>
      )}
    </main>
  );
}

function PlayerView({
  details,
  viewerId,
}: {
  details: OfferDetails;
  viewerId: string;
}) {
  const t = useTranslations("OfferPage");
  const tJoinRefusal = useTranslations("JoinRefusal");
  const { offer, viewerJoin } = details;

  if (viewerJoin?.status === "REQUESTED" || viewerJoin?.status === "ACCEPTED") {
    return (
      <div className="space-y-3">
        <p className="font-medium">
          {offer.status === "CANCELLED"
            ? t("authorCancelled")
            : viewerJoin.status === "ACCEPTED"
              ? t("youAreIn")
              : t("requestSent")}
        </p>
        {offer.status !== "CANCELLED" && offer.startsAt > new Date() && (
          <OfferActionButton
            action={withdrawJoin.bind(null, viewerJoin.id)}
            label={t("withdraw")}
            pendingLabel={t("withdrawing")}
            variant="outline"
          />
        )}
        <JoinThread
          offerJoinId={viewerJoin.id}
          viewerId={viewerId}
          senderNames={{
            [offer.author.id]: offer.author.name ?? t("defaultAuthorName"),
          }}
          defaultOpen
        />
        {viewerJoin.status === "ACCEPTED" && (
          <ResultSection
            join={viewerJoin}
            offer={offer}
            party="PLAYER"
            opponentName={offer.author.name ?? t("theAuthor")}
          />
        )}
      </div>
    );
  }

  const refusal = joinRefusal({
    offer: { ...offer, authorId: offer.author.id },
    playerId: viewerId,
    existing: viewerJoin,
    now: new Date(),
  });
  if (refusal) {
    return <p className="text-muted-foreground">{tJoinRefusal(refusal)}</p>;
  }
  return (
    <OfferActionButton
      action={requestToJoin.bind(null, offer.id)}
      label={t("askToJoin")}
      pendingLabel={t("sending")}
      trackMeaningfulAction
    />
  );
}

function AuthorView({
  details,
  started,
  viewerId,
}: {
  details: OfferDetails;
  started: boolean;
  viewerId: string;
}) {
  const t = useTranslations("OfferPage");
  const tReliability = useTranslations("Reliability");
  const requested = details.joins.filter((join) => join.status === "REQUESTED");
  const accepted = details.joins.filter((join) => join.status === "ACCEPTED");
  // A full, cancelled or past offer takes nobody more; the author can still
  // answer with "decline".
  const canAccept =
    details.spotsLeft > 0 && !started && details.offer.status === "OPEN";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-semibold">
          {t("playersIn", { count: accepted.length })}
        </h2>
        {accepted.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">{t("nobodyYet")}</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {accepted.map((join) => (
              <li key={join.id}>
                <PlayerLink player={join.user} />
                <JoinThread
                  offerJoinId={join.id}
                  viewerId={viewerId}
                  senderNames={{
                    [join.user.id]: join.user.name ?? t("aPlayer"),
                  }}
                />
                <ResultSection
                  join={join}
                  offer={details.offer}
                  party="AUTHOR"
                  opponentName={join.user.name ?? t("thePlayer")}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <h2 className="font-semibold">
          {t("requestsCount", { count: requested.length })}
        </h2>
        {requested.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            {t("noRequestsWaiting")}
          </p>
        ) : (
          <ul className="mt-2 divide-y rounded-lg border">
            {requested.map((join) => (
              <li key={join.id} className="px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <PlayerLink player={join.user} />
                    <p className="text-xs text-muted-foreground">
                      {reliabilityLabel(tReliability, join.user.reliability)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {canAccept && (
                      <OfferActionButton
                        action={acceptJoin.bind(null, join.id)}
                        label={t("accept")}
                        pendingLabel={t("accepting")}
                      />
                    )}
                    <OfferActionButton
                      action={declineJoin.bind(null, join.id)}
                      label={t("decline")}
                      pendingLabel={t("declining")}
                      variant="outline"
                    />
                  </div>
                </div>
                <JoinThread
                  offerJoinId={join.id}
                  viewerId={viewerId}
                  senderNames={{
                    [join.user.id]: join.user.name ?? t("aPlayer"),
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
      {canCancelOffer(details.offer, new Date()) && (
        <OfferActionButton
          action={cancelOffer.bind(null, details.offer.id)}
          label={t("cancelOfferLabel")}
          confirmLabel={t("confirmCancel")}
          pendingLabel={t("cancelling")}
          variant="outline"
        />
      )}
    </div>
  );
}

function PlayerLink({ player }: { player: OfferPlayer }) {
  const t = useTranslations("OfferPage");
  return (
    <Link
      href={`/players/${player.id}`}
      className="inline-flex items-center gap-1.5 hover:underline"
    >
      <PlayerAvatar
        name={player.name ?? t("aPlayer")}
        avatarPath={player.avatarPath}
        size={24}
      />
      <span>
        {player.name ?? t("aPlayer")}
        {player.selfRatedNtrp !== null &&
          ` · NTRP ${player.selfRatedNtrp.toFixed(1)}`}
      </span>
    </Link>
  );
}

// A join's result, from whichever side is looking (tasks 4.6, 4.7, 4.10):
// nothing before the match starts or for doubles (no result form there at
// all); the submit form once it's started and nobody has filed one yet; a
// confirm/dispute choice, or a no-show's dispute-only choice, for whoever
// didn't file it while it's still PENDING, and just the score (or report)
// for whoever did; the score and this viewer's own ELO change once
// CONFIRMED; a note once DISPUTED or NO_SHOW.
function ResultSection({
  join,
  offer,
  party,
  opponentName,
}: {
  join: { id: string; result: OfferJoinResult | null };
  offer: { format: OfferFormat; startsAt: Date };
  party: MatchParty;
  opponentName: string;
}) {
  const t = useTranslations("ResultSection");

  if (offer.format !== "SINGLES" || offer.startsAt > new Date()) {
    return null;
  }
  const { result } = join;

  if (!result) {
    return (
      <details className="mt-2">
        <summary className="cursor-pointer text-sm text-muted-foreground">
          {t("submitResultSummary")}
        </summary>
        <div className="mt-2">
          <ResultForm
            action={submitResult.bind(null, join.id)}
            onNoShow={submitNoShow.bind(null, join.id)}
            viewerParty={party}
            opponentName={opponentName}
          />
        </div>
      </details>
    );
  }

  if (result.noShowParty) {
    const viewerDidntShow = result.noShowParty === party;
    if (result.status === "PENDING") {
      if (result.reportedBy === party) {
        return (
          <p className="mt-2 text-sm text-muted-foreground">
            {t("reportedNoShowWaiting", { name: opponentName })}
          </p>
        );
      }
      return (
        <div className="mt-2 space-y-2">
          <p className="text-sm">
            {t("opponentReportedNoShow", { name: opponentName })}
          </p>
          <OfferActionButton
            action={disputeResult.bind(null, result.id)}
            label={t("dispute")}
            pendingLabel={t("disputing")}
            variant="outline"
          />
        </div>
      );
    }
    if (result.status === "NO_SHOW") {
      return (
        <p className="mt-2 text-sm text-muted-foreground">
          {t("noShowConfirmed", {
            who: viewerDidntShow ? t("you") : opponentName,
          })}
        </p>
      );
    }
    if (result.status === "DISPUTED") {
      return (
        <p className="mt-2 text-sm text-muted-foreground">
          {t("noShowDisputed")}
        </p>
      );
    }
    if (result.status === "ANNULLED") {
      return (
        <p className="mt-2 text-sm text-muted-foreground">
          {t("noShowAnnulled")}
        </p>
      );
    }
    return null;
  }

  // The viewer's own games first — same convention as the match history
  // (4.9), so "4-6, 3-6" always means "I lost both sets" to whoever reads it.
  const score = formatScoreFor(result.score as SetScore[], party === "AUTHOR");

  if (result.status === "PENDING") {
    if (result.reportedBy === party) {
      return (
        <p className="mt-2 text-sm text-muted-foreground">
          {t("resultSubmittedWaiting", { score, name: opponentName })}
        </p>
      );
    }
    return (
      <div className="mt-2 space-y-2">
        <p className="text-sm">
          {t("opponentReported", { name: opponentName, score })}
        </p>
        <div className="flex gap-2">
          <OfferActionButton
            action={confirmResult.bind(null, result.id)}
            label={t("confirm")}
            pendingLabel={t("confirming")}
          />
          <OfferActionButton
            action={disputeResult.bind(null, result.id)}
            label={t("dispute")}
            pendingLabel={t("disputing")}
            variant="outline"
          />
        </div>
      </div>
    );
  }

  if (result.status === "CONFIRMED") {
    const before =
      party === "AUTHOR" ? result.authorEloBefore : result.playerEloBefore;
    const after =
      party === "AUTHOR" ? result.authorEloAfter : result.playerEloAfter;
    return (
      <p className="mt-2 text-sm text-muted-foreground">
        {t("confirmed", { score })}
        {before !== null && after !== null && (
          <> {t("yourElo", { change: eloChangeLabel(before, after) })}</>
        )}
      </p>
    );
  }

  if (result.status === "DISPUTED") {
    return (
      <p className="mt-2 text-sm text-muted-foreground">
        {t("resultDisputed", { score })}
      </p>
    );
  }

  if (result.status === "ANNULLED") {
    return (
      <p className="mt-2 text-sm text-muted-foreground">
        {t("resultAnnulled", { score })}
      </p>
    );
  }

  return null;
}
