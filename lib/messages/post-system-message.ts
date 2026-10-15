import { db } from "@/lib/db";
import type { SystemMessageKey } from "@/lib/messages/system-message-keys";

export type { SystemMessageKey } from "@/lib/messages/system-message-keys";

// A message with no human sender (task 3.16's model note): `type: SYSTEM`
// and a null senderId, enforced together by a CHECK in the migration. A
// thread is identified the same way messages are (decision 3.1): exactly
// one of offerJoinId/offerId. Used today only for a new private thread's
// welcome note (below); sessions 04, 06 and 07 reuse it for other notices,
// including the group thread (3.21) via { offerId }.
export type ThreadRef = { offerJoinId: string } | { offerId: string };

// Task 1.20: `content` holds one of system-message-keys.ts's keys, not the
// sentence itself — a thread's two participants can have different saved
// languages (users.locale), and a single stored row can't be two sentences
// at once. MessageThread (components/message-thread.tsx) looks the key up
// in the "SystemMessages" catalog in the *viewer's own* language at render
// time. A message written before this change stored the literal English
// sentence instead (never rewritten, decision 2026-10-15) —
// isSystemMessageKey() is how the renderer tells the two apart, falling
// back to showing a pre-1.20 row exactly as it always has.
export async function postSystemMessage(
  thread: ThreadRef,
  key: SystemMessageKey,
): Promise<void> {
  await db.message.create({
    data: { type: "SYSTEM", content: key, ...thread },
  });
}

// The first message in every new private thread (task 3.17): a safety
// reminder, since the thread is also how strangers first arrange to meet.
export const THREAD_WELCOME_MESSAGE = "THREAD_WELCOME";

// Result and confirmation notices (task 4.7): filed when a result is
// submitted, confirmed (manually or by the cron auto-confirm, 5.8) or
// disputed. Generic text — both sides already know the score from the form.
export const RESULT_SUBMITTED_MESSAGE = "RESULT_SUBMITTED";
export const RESULT_CONFIRMED_MESSAGE = "RESULT_CONFIRMED";
export const RESULT_AUTO_CONFIRMED_MESSAGE = "RESULT_AUTO_CONFIRMED";
export const RESULT_DISPUTED_MESSAGE = "RESULT_DISPUTED";

// A no-show report (task 4.10): filed when one side marks the other as
// having not shown up. Disputing it reuses RESULT_DISPUTED_MESSAGE above —
// the same generic text fits either kind of report. No message for the
// cron auto-confirming it (decision 2026-10-14's own scope: a notice at
// filing and at disputing, not at the silent 72h deadline).
export const RESULT_NO_SHOW_REPORTED_MESSAGE = "RESULT_NO_SHOW_REPORTED";

// The author marking the court as booked, after clicking through to the
// club's booking link or phone number (task 2.13).
export const COURT_BOOKED_MESSAGE = "COURT_BOOKED";
