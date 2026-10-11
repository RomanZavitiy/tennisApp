import type { OfferFormat } from "@/lib/generated/prisma/enums";

// How an offer's facts read on its card (3.6) and, later, its page (3.13).

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
