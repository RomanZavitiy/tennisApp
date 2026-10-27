import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getFormatter, getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { requestToJoin, withdrawJoin } from "@/app/offers/[id]/actions";
import { reportOffer } from "@/app/offers/[id]/report-actions";
import { JoinThread } from "@/components/join-thread";
import { MarkMeaningfulAction } from "@/components/mark-meaningful-action";
import { MarkNotificationsRead } from "@/components/mark-notifications-read";
import { OfferActionButton } from "@/components/offer-action-button";
import { AuthorView } from "@/components/offer-author-view";
import { OfferBookingSection } from "@/components/offer-booking-section";
import { PlayerLink } from "@/components/player-link";
import { ReportButton } from "@/components/report-button";
import { ResultSection } from "@/components/result-section";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/require-user";
import { joinRefusal } from "@/lib/offers/join-rules";
import { formatKrakowTimeRange } from "@/lib/offers/krakow-time";
import { getOfferDetails, type OfferDetails } from "@/lib/offers/offer-details";
import {
  formatLabel,
  levelLabel,
  placeLabel,
  spotsLabel,
} from "@/lib/offers/offer-labels";
import { DISTRICT_LABELS } from "@/lib/profile/options";

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
      {/* Opening the offer is reading what its notifications said (K2b). */}
      {viewer && <MarkNotificationsRead offerId={offer.id} />}
      <p className="text-sm text-muted-foreground">
        {formatLabel(tOfferLabels, offer)}
      </p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">
        <time dateTime={offer.startsAt.toISOString()}>
          {formatKrakowTimeRange(format, offer.startsAt, offer.durationMinutes)}
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
          startsAt={offer.startsAt}
          durationMinutes={offer.durationMinutes}
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
