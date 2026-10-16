// Client-side error monitoring (task 6.19). Next.js loads this file
// automatically in the browser bundle — the counterpart to
// instrumentation.ts's server/edge setup.
import * as Sentry from "@sentry/nextjs";

import { scrubEvent } from "@/lib/monitoring/scrub-event";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
  tracesSampleRate: Number(
    process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? 0,
  ),
  beforeSend: scrubEvent,
});
