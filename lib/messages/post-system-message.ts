import { db } from "@/lib/db";

// A message with no human sender (task 3.16's model note): `type: SYSTEM`
// and a null senderId, enforced together by a CHECK in the migration. A
// thread is identified the same way messages are (decision 3.1): exactly
// one of offerJoinId/offerId. Used today only for a new private thread's
// welcome note (below); sessions 04, 06 and 07 reuse it for other notices,
// including the group thread (3.21) via { offerId }.
export type ThreadRef = { offerJoinId: string } | { offerId: string };

export async function postSystemMessage(
  thread: ThreadRef,
  text: string,
): Promise<void> {
  await db.message.create({
    data: { type: "SYSTEM", content: text, ...thread },
  });
}

// The first message in every new private thread (task 3.17): a safety
// reminder, since the thread is also how strangers first arrange to meet.
export const THREAD_WELCOME_MESSAGE =
  "Meet at the court. Never send money in advance.";

// Result and confirmation notices (task 4.7): filed when a result is
// submitted, confirmed (manually or by the cron auto-confirm, 5.8) or
// disputed. Generic text — both sides already know the score from the form.
export const RESULT_SUBMITTED_MESSAGE =
  "Match result submitted. Waiting for the other player to confirm.";
export const RESULT_CONFIRMED_MESSAGE =
  "Match result confirmed. Both players' ELO has been updated.";
export const RESULT_AUTO_CONFIRMED_MESSAGE =
  "Match result automatically confirmed after 72 hours. Both players' ELO has been updated.";
export const RESULT_DISPUTED_MESSAGE =
  "Match result disputed. An admin will review it.";

// A no-show report (task 4.10): filed when one side marks the other as
// having not shown up. Disputing it reuses RESULT_DISPUTED_MESSAGE above —
// the same generic text fits either kind of report. No message for the
// cron auto-confirming it (decision 2026-10-14's own scope: a notice at
// filing and at disputing, not at the silent 72h deadline).
export const RESULT_NO_SHOW_REPORTED_MESSAGE =
  "Opponent marked as a no-show. They can dispute this within 72 hours.";

// The author marking the court as booked, after clicking through to the
// club's booking link or phone number (task 2.13).
export const COURT_BOOKED_MESSAGE = "The court has been booked.";
