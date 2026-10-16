import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
// @sentry/nextjs 11's build-config helper lives at this subpath, not the
// package root (which is reserved for the runtime SDK, client/server/edge).
import { withSentryConfig } from "@sentry/nextjs/config";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  // Otherwise `next dev` appends its own agent-rules block to our AGENTS.md
  // whenever an AI agent runs it — AGENTS.md is owned by us (see decisions.md).
  agentRules: false,
};

// Task 6.19: uploads source maps on build so a minified stack trace in
// Sentry resolves back to real file/line. Silently skips the upload (just a
// console note, the build still succeeds) when SENTRY_AUTH_TOKEN/
// SENTRY_ORG/SENTRY_PROJECT aren't set — e.g. every local build.
export default withSentryConfig(withNextIntl(nextConfig), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  widenClientFileUpload: true,
});
