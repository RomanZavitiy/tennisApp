import type { District, OfferFormat } from "@/lib/generated/prisma/enums";
import { toKrakowLocal } from "@/lib/offers/krakow-time";

const PLAY_AGAIN_DAYS_AHEAD = 7;

export type PlayAgainOffer = {
  startsAt: Date;
  durationMinutes: number;
  format: OfferFormat;
  clubId: string | null;
  district: District | null;
  ntrpMin: number | null;
  ntrpMax: number | null;
  /** The finished match's opponent (task Q.2, after S1): invited straight
   * away once the new offer is created. */
  opponentId: string;
};

/**
 * `local` ("YYYY-MM-DDTHH:mm"), `days` calendar days ahead, same time of
 * day. Adding to the local Y-M-D — not the UTC instant — means the
 * Europe/Warsaw DST switch (last Sunday of March/October) never shifts the
 * hour: 18:00 stays 18:00 even when the days in between cross it.
 */
export function krakowLocalPlusDays(local: string, days: number): string {
  const [datePart, timePart] = local.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${String(next.getUTCFullYear())}-${pad(next.getUTCMonth() + 1)}-${pad(next.getUTCDate())}T${timePart}`;
}

/**
 * Query params for "play again" (task Q.1): same club/district, format,
 * duration and NTRP range as the finished match's offer, the same day of
 * week and time one week on. Unknown/empty fields are simply left out, the
 * same "ignore what's missing" convention `/offers/new` already follows
 * for `clubId` (task 2.10). Task Q.2 (after S1) adds `invite`: the past
 * opponent, sent an invite the moment the new offer is created
 * (createOffer, app/(member)/offers/new/actions.ts) — before S1 this was
 * prefill only.
 */
export function playAgainParams(offer: PlayAgainOffer): URLSearchParams {
  const params = new URLSearchParams();
  params.set("format", offer.format);
  params.set("durationMinutes", String(offer.durationMinutes));
  params.set(
    "startsAt",
    krakowLocalPlusDays(toKrakowLocal(offer.startsAt), PLAY_AGAIN_DAYS_AHEAD),
  );
  params.set("invite", offer.opponentId);
  if (offer.clubId) {
    params.set("clubId", offer.clubId);
  }
  if (offer.district) {
    params.set("district", offer.district);
  }
  if (offer.ntrpMin !== null) {
    params.set("ntrpMin", String(offer.ntrpMin));
  }
  if (offer.ntrpMax !== null) {
    params.set("ntrpMax", String(offer.ntrpMax));
  }
  return params;
}
