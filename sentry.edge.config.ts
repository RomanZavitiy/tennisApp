// Edge-runtime error monitoring (task 6.19) — covers proxy.ts, which runs on
// the edge runtime. Loaded by instrumentation.ts's register() for the "edge"
// runtime only.
import * as Sentry from "@sentry/nextjs";

import { scrubEvent } from "@/lib/monitoring/scrub-event";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0),
  beforeSend: scrubEvent,
});
