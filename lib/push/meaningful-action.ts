// "Ask for notification permission only after a meaningful action (the
// first offer created or the first join request), never on first load"
// (task 5.15). The trigger is a flag in localStorage, set by whichever of
// the two happens first (components/mark-meaningful-action.tsx,
// offer-action-button.tsx's onSuccess on "Ask to join") and read by
// PushSubscribePrompt wherever it's mounted. Browser-only: every call is
// wrapped, since localStorage can throw (private browsing, blocked storage).

const KEY = "mf:meaningful-action";

export function markMeaningfulAction(): void {
  try {
    localStorage.setItem(KEY, "1");
  } catch {
    // Storage blocked — the prompt just won't appear this session.
  }
}

export function hasMeaningfulAction(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}
