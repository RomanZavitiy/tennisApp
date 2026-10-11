import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import {
  acceptJoin,
  declineJoin,
  requestToJoin,
  withdrawJoin,
} from "@/app/offers/[id]/actions";
import { OfferActionButton } from "@/components/offer-action-button";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/require-user";
import { SURFACE_LABELS } from "@/lib/clubs/surface-labels";
import { JOIN_REFUSAL_MESSAGES, joinRefusal } from "@/lib/offers/join-rules";
import { formatKrakowTime } from "@/lib/offers/krakow-time";
import {
  getOfferDetails,
  type OfferDetails,
  type OfferPlayer,
} from "@/lib/offers/offer-details";
import {
  formatLabel,
  levelLabel,
  placeLabel,
  spotsLabel,
} from "@/lib/offers/offer-labels";

// An offer's page (task 3.13), public. A guest sees the details and a sign-in
// link; a player sees their request and what they can do with it; the
// author sees the requests with accept/decline and the free places. Which
// buttons appear is only a convenience — every action checks again (3.11,
// 3.12).

// Typed by hand, like /players/[id]: generated PageProps need `next typegen`.
type OfferPageProps = { params: Promise<{ id: string }> };

export const metadata: Metadata = { title: "Sparring offer" };

export default async function OfferPage({ params }: OfferPageProps) {
  // Requests change the page all the time; never serve a cached one.
  await connection();
  const { id } = await params;
  const viewer = await getCurrentUser();
  const details = await getOfferDetails(id, viewer?.id ?? null);
  if (!details) {
    notFound();
  }
  const { offer } = details;
  const started = offer.startsAt <= new Date();

  const facts = [
    { label: "Where", value: placeLabel(offer) },
    { label: "Level", value: levelLabel(offer.ntrpMin, offer.ntrpMax) },
    ...(offer.surface
      ? [{ label: "Surface", value: SURFACE_LABELS[offer.surface] }]
      : []),
  ];

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 py-10">
      <p className="text-sm text-muted-foreground">{formatLabel(offer)}</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">
        <time dateTime={offer.startsAt.toISOString()}>
          {formatKrakowTime(offer.startsAt)}
        </time>
      </h1>
      <p className="mt-2 font-medium text-primary">
        {offer.status === "CANCELLED"
          ? "Cancelled"
          : started
            ? "Already started"
            : spotsLabel(details.spotsLeft)}
      </p>

      <dl className="mt-6 space-y-3">
        {facts.map((fact) => (
          <div key={fact.label} className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{fact.label}</dt>
            <dd className="text-right font-medium">{fact.value}</dd>
          </div>
        ))}
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Posted by</dt>
          <dd className="text-right font-medium">
            <PlayerLink player={offer.author} />
          </dd>
        </div>
      </dl>
      {offer.club && (
        <Link
          href={`/clubs/${offer.club.id}`}
          className="mt-3 inline-block text-sm hover:underline"
        >
          About {offer.club.name}
        </Link>
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
            Sign in to join
          </Link>
        ) : details.isAuthor ? (
          <AuthorView details={details} started={started} />
        ) : (
          <PlayerView details={details} viewerId={viewer.id} />
        )}
      </section>
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
  const { offer, viewerJoin } = details;

  if (viewerJoin?.status === "REQUESTED" || viewerJoin?.status === "ACCEPTED") {
    return (
      <div className="space-y-3">
        <p className="font-medium">
          {viewerJoin.status === "ACCEPTED"
            ? "You're in. See you on court!"
            : "Request sent. The author will answer soon."}
        </p>
        {offer.status !== "CANCELLED" && offer.startsAt > new Date() && (
          <OfferActionButton
            action={withdrawJoin.bind(null, viewerJoin.id)}
            label="Withdraw"
            pendingLabel="Withdrawing…"
            variant="outline"
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
    return (
      <p className="text-muted-foreground">{JOIN_REFUSAL_MESSAGES[refusal]}</p>
    );
  }
  return (
    <OfferActionButton
      action={requestToJoin.bind(null, offer.id)}
      label="Ask to join"
      pendingLabel="Sending…"
    />
  );
}

function AuthorView({
  details,
  started,
}: {
  details: OfferDetails;
  started: boolean;
}) {
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
          Players in ({String(accepted.length)})
        </h2>
        {accepted.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Nobody yet.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {accepted.map((join) => (
              <li key={join.id}>
                <PlayerLink player={join.user} />
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <h2 className="font-semibold">Requests ({String(requested.length)})</h2>
        {requested.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            No requests waiting.
          </p>
        ) : (
          <ul className="mt-2 divide-y rounded-lg border">
            {requested.map((join) => (
              <li
                key={join.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <PlayerLink player={join.user} />
                <div className="flex gap-2">
                  {canAccept && (
                    <OfferActionButton
                      action={acceptJoin.bind(null, join.id)}
                      label="Accept"
                      pendingLabel="Accepting…"
                    />
                  )}
                  <OfferActionButton
                    action={declineJoin.bind(null, join.id)}
                    label="Decline"
                    pendingLabel="Declining…"
                    variant="outline"
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function PlayerLink({ player }: { player: OfferPlayer }) {
  return (
    <Link href={`/players/${player.id}`} className="hover:underline">
      {player.name ?? "A player"}
      {player.selfRatedNtrp !== null &&
        ` · NTRP ${player.selfRatedNtrp.toFixed(1)}`}
    </Link>
  );
}
