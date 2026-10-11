import type { OfferStatus } from "@/lib/generated/prisma/enums";

// When the author may cancel their offer (task 3.14): while it is still
// ahead — open or full. A started offer is history (results hang off it in
// Epic 4), and a cancelled one stays cancelled.
export function canCancelOffer(
  offer: { status: OfferStatus; startsAt: Date },
  now: Date,
): boolean {
  return offer.status !== "CANCELLED" && offer.startsAt > now;
}
