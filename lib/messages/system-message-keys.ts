// Task 1.20: split out of post-system-message.ts, which imports the
// database client — importing anything from that module at all (even a
// pure type guard) would otherwise pull `db` into the browser bundle for
// MessageThread (a Client Component, which only needs to recognize a key,
// never write one). See post-system-message.ts for what these keys mean.
export type SystemMessageKey =
  | "THREAD_WELCOME"
  | "RESULT_SUBMITTED"
  | "RESULT_CONFIRMED"
  | "RESULT_AUTO_CONFIRMED"
  | "RESULT_DISPUTED"
  | "RESULT_NO_SHOW_REPORTED"
  | "COURT_BOOKED";

const SYSTEM_MESSAGE_KEYS: ReadonlySet<string> = new Set<SystemMessageKey>([
  "THREAD_WELCOME",
  "RESULT_SUBMITTED",
  "RESULT_CONFIRMED",
  "RESULT_AUTO_CONFIRMED",
  "RESULT_DISPUTED",
  "RESULT_NO_SHOW_REPORTED",
  "COURT_BOOKED",
]);

export function isSystemMessageKey(
  content: string,
): content is SystemMessageKey {
  return SYSTEM_MESSAGE_KEYS.has(content);
}
