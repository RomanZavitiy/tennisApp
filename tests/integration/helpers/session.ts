import { AsyncLocalStorage } from "node:async_hooks";

// The signed-in user for a server action called from a test. Async-local
// rather than a module variable, so two actions racing each other in one
// Promise.all can be two different players.

const session = new AsyncLocalStorage<{ id: string }>();

/** Calls `action` as `userId` -- what the session cookie would say. */
export function runAs<T>(userId: string, action: () => Promise<T>): Promise<T> {
  return session.run({ id: userId }, action);
}

export function currentSessionUser(): { id: string; email: undefined } {
  const user = session.getStore();
  if (!user) {
    throw new Error("No session: call the action inside runAs(userId, ...).");
  }
  return { id: user.id, email: undefined };
}
