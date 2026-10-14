import type {
  CourtStatus,
  District,
  OfferFormat,
} from "@/lib/generated/prisma/enums";
import { DISTRICT_LABELS } from "@/lib/profile/options";

// How an offer's facts read on its card (3.6) and, later, its page (3.13).

// Court status (task 3.22). No database import — the offer form (a client
// component) uses this too.
export const COURT_STATUS_LABELS: Record<CourtStatus, string> = {
  BOOKED: "Court booked",
  WILL_BOOK: "Will book once we agree",
  ANY: "Whoever books first",
};

export function formatLabel(offer: {
  format: OfferFormat;
  hasPartner: boolean;
}): string {
  if (offer.format === "SINGLES") {
    return "Singles";
  }
  return offer.hasPartner ? "Doubles · has a partner" : "Doubles";
}

export function spotsLabel(spotsLeft: number): string {
  if (spotsLeft === 0) {
    return "Full";
  }
  return spotsLeft === 1 ? "1 spot left" : `${String(spotsLeft)} spots left`;
}

/** "NTRP 3.0–4.5", "NTRP 3.0+", "NTRP up to 4.5" or "Any level". */
export function levelLabel(
  ntrpMin: number | null,
  ntrpMax: number | null,
): string {
  if (ntrpMin !== null && ntrpMax !== null) {
    return ntrpMin === ntrpMax
      ? `NTRP ${ntrpMin.toFixed(1)}`
      : `NTRP ${ntrpMin.toFixed(1)}–${ntrpMax.toFixed(1)}`;
  }
  if (ntrpMin !== null) {
    return `NTRP ${ntrpMin.toFixed(1)}+`;
  }
  if (ntrpMax !== null) {
    return `NTRP up to ${ntrpMax.toFixed(1)}`;
  }
  return "Any level";
}

/** "Club name, District", or whichever of the two the offer has. */
export function placeLabel(offer: {
  club: { name: string } | null;
  district: District | null;
}): string {
  return [offer.club?.name, offer.district && DISTRICT_LABELS[offer.district]]
    .filter(Boolean)
    .join(", ");
}
