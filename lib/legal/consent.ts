// The version of Terms/Privacy a player last agreed to (tasks 6.11, 6.12).
// Dated like a decisions.md entry, not semver: bump it whenever the human
// publishes a real revision of either document, so every signed-in user —
// new or existing — sees the consent screen again for the new version.
export const CURRENT_CONSENT_VERSION = "2026-10-16";

export function needsConsent(consentVersion: string | null): boolean {
  return consentVersion !== CURRENT_CONSENT_VERSION;
}
