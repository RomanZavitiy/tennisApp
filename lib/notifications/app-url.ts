// The origin that links in emails point at (the action button and the
// unsubscribe link, lib/notifications/notify.ts). Both variables are set by
// Vercel itself — no env var of our own to set up.
//
// Production uses VERCEL_PROJECT_PRODUCTION_URL, the project's public
// domain. VERCEL_URL is the generated per-deployment hostname instead: it
// sits behind Vercel's Deployment Protection, so a player following a link
// to it lands on a Vercel sign-in page, not the app.
//
// Preview keeps VERCEL_URL on purpose: VERCEL_PROJECT_PRODUCTION_URL is set
// there too, but a staging email must never link to production, which runs
// on a different database.
export function appUrl(): string {
  const {
    VERCEL_ENV: env,
    VERCEL_PROJECT_PRODUCTION_URL: productionHost,
    VERCEL_URL: deploymentHost,
  } = process.env;

  if (env === "production" && productionHost) {
    return `https://${productionHost}`;
  }
  return deploymentHost ? `https://${deploymentHost}` : "http://localhost:3000";
}
