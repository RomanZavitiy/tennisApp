import type { ErrorEvent } from "@sentry/nextjs";

// Shared `beforeSend` for all three Sentry configs (client/server/edge,
// task 6.19): "email/ім'я користувача не передаються" enforced in code,
// not left to the SDK's defaults — this version of @sentry/nextjs dropped
// the old `sendDefaultPii` init option, so there's no single flag to rely
// on instead. `beforeSend`'s second (hint) argument is unused, so it's
// dropped rather than named and ignored.
export function scrubEvent(event: ErrorEvent): ErrorEvent {
  delete event.user;
  if (event.request) {
    delete event.request.cookies;
    if (event.request.headers) {
      delete event.request.headers["cookie"];
      delete event.request.headers["authorization"];
    }
  }
  return event;
}
