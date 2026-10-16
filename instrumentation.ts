import * as Sentry from "@sentry/nextjs";

// Next.js calls register() once per server runtime at startup (task 6.19):
// each runtime gets its own Sentry.init (sentry.server.config.ts /
// sentry.edge.config.ts), since the SDK's transport differs between them.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Next.js calls this for an error thrown while rendering/handling a request
// that it would otherwise only log — without it, server-side render errors
// never reach Sentry, only ones from inside a try/catch that calls
// Sentry.captureException itself.
export const onRequestError = Sentry.captureRequestError;
