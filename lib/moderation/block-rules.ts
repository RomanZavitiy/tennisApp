// Whether a blocked player may create offers, join requests or messages
// (task 6.4, decision 2026-10-14): never, until an admin clears blockedAt.
// A pure check so every caller shows the same explanation — "sees why"
// (DoD) is this message surfacing wherever the refused action was tried.

export const BLOCKED_MESSAGE =
  "Your account is blocked pending a review. You can't create offers, join requests or messages until an admin makes a decision.";

export function blockedRefusal(user: {
  blockedAt: Date | null;
}): string | null {
  return user.blockedAt ? BLOCKED_MESSAGE : null;
}
