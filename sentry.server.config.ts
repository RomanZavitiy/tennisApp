// Server-side error monitoring (task 6.19). Loaded by instrumentation.ts's
// register() for the "nodejs" runtime only. Free Sentry plan: errors only,
// no performance tracing (SENTRY_TRACES_SAMPLE_RATE lets a human turn it on
// later without a code change).
import * as Sentry from "@sentry/nextjs";

import { scrubEvent } from "@/lib/monitoring/scrub-event";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0),
  beforeSend: scrubEvent,
});
