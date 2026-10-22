import { captureEvent } from "@/lib/analytics/posthog";
import { db } from "@/lib/db";
import {
  COURT_BOOKED_MESSAGE,
  postSystemMessage,
} from "@/lib/messages/post-system-message";
import { notify } from "@/lib/notifications/notify";

/**
 * K.21: flips an offer's courtStatus to BOOKED and tells every player with a
 * live request or place — the same write and notifications markCourtBooked
 * (task 2.13, author clicks through to an EXTERNAL_LINK club) already does.
 * Shared so confirmBooking (K.17, SPINBUDDY: staff confirms a request made
 * from this offer) reuses the exact same path instead of a second copy.
 * Idempotent: a no-op once the court is already booked, since either side
 * (the author marking it by hand, staff confirming) might get there first.
 */
export async function markOfferCourtBooked(
  offerId: string,
  actorId: string,
): Promise<void> {
  const offer = await db.sparringOffer.findUnique({
    where: { id: offerId },
    select: { courtStatus: true },
  });
  if (!offer || offer.courtStatus === "BOOKED") {
    return;
  }

  const activeJoins = await db.offerJoin.findMany({
    where: { offerId, status: { in: ["REQUESTED", "ACCEPTED"] } },
    select: { id: true, userId: true },
  });
  await db.sparringOffer.update({
    where: { id: offerId },
    data: { courtStatus: "BOOKED" },
  });
  await Promise.all(
    activeJoins.map((join) =>
      notify(join.userId, { kind: "COURT_BOOKED", offerId }),
    ),
  );
  await Promise.all(
    activeJoins.map((join) =>
      postSystemMessage({ offerJoinId: join.id }, COURT_BOOKED_MESSAGE),
    ),
  );
  await captureEvent("court_marked_booked", actorId, {});
}
