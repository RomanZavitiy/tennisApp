import type { OfferFormat } from "@/lib/generated/prisma/enums";

// How many players an offer needs besides its author (decisions.md, task 3.1).
// The author's partner in doubles is only a mark, so it takes a place without
// a join. Not stored in the database: this is the only place that knows it.

export function playersNeeded(offer: {
  format: OfferFormat;
  hasPartner: boolean;
}): number {
  if (offer.format === "SINGLES") {
    return 1;
  }
  return offer.hasPartner ? 2 : 3;
}
