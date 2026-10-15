// Whether a blocked player may create offers, join requests or messages
// (task 6.4, decision 2026-10-14): never, until an admin clears blockedAt.
// A pure check so every caller shows the same explanation — "sees why"
// (DoD) is this message surfacing wherever the refused action was tried.
// `t` is a translator for the "Errors" namespace (task 1.20).
export function blockedRefusal(
  t: (key: string) => string,
  user: { blockedAt: Date | null },
): string | null {
  return user.blockedAt ? t("blocked") : null;
}
