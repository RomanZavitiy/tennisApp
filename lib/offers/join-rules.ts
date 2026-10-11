import type { JoinStatus, OfferStatus } from "@/lib/generated/prisma/enums";

// Who may ask to join an offer (task 3.11). A pure function, so every rule
// has a test; the server action only loads the rows and acts on the answer.
// A player has at most one join row per offer (unique since 0.12), so asking
// again after withdrawing reuses that row (decision for 3.10).

export type JoinRefusal =
  "OWN_OFFER" | "STARTED" | "NOT_OPEN" | "ALREADY_REQUESTED" | "DECLINED";

export const JOIN_REFUSAL_MESSAGES: Record<JoinRefusal, string> = {
  OWN_OFFER: "This is your own offer.",
  STARTED: "This game has already started.",
  NOT_OPEN: "This offer is no longer taking players.",
  ALREADY_REQUESTED: "You have already asked to join.",
  DECLINED: "The author has declined your request.",
};

/** Why the player can't ask to join, or null when they can. */
export function joinRefusal({
  offer,
  playerId,
  existing,
  now,
}: {
  offer: { authorId: string; status: OfferStatus; startsAt: Date };
  playerId: string;
  /** The player's earlier join on this offer, if any. */
  existing: { status: JoinStatus } | null;
  now: Date;
}): JoinRefusal | null {
  if (offer.authorId === playerId) {
    return "OWN_OFFER";
  }
  if (offer.startsAt <= now) {
    return "STARTED";
  }
  if (offer.status !== "OPEN") {
    return "NOT_OPEN";
  }
  if (existing?.status === "REQUESTED" || existing?.status === "ACCEPTED") {
    return "ALREADY_REQUESTED";
  }
  // The author's "no" stands; a player who withdrew may change their mind.
  if (existing?.status === "DECLINED") {
    return "DECLINED";
  }
  return null;
}
