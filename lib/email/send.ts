import { Resend } from "resend";

// The one place `resend` is called (task 5.1-5.2). Without a verified
// domain, Resend only delivers to the account owner's address regardless of
// `to` (decision 2026-09-24) — expected at this stage, not a bug here. In
// dev, nothing goes out at all: "у dev листи не йдуть реальним людям" (this
// session's prompt) — a local `pnpm dev` would otherwise email the owner on
// every test request. Preview and production both have NODE_ENV=production
// (Next.js sets it for any `next build`/`next start`), so this only
// suppresses local development, not Vercel's preview deploys.
const FROM_ADDRESS = "MatchFinder Kraków <onboarding@resend.dev>";

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type SendEmailOutcome = { ok: true } | { ok: false };

let client: Resend | null = null;

function getClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }
  client ??= new Resend(apiKey);
  return client;
}

/**
 * Sends one email. Never throws (same contract as sendPush, task 5.16: a
 * send failure is logged and doesn't break the action that triggered it).
 */
export async function sendEmail(
  input: SendEmailInput,
): Promise<SendEmailOutcome> {
  if (process.env.NODE_ENV !== "production") {
    console.warn(`[dev] Email to ${input.to} suppressed: ${input.subject}`);
    return { ok: true };
  }

  const resend = getClient();
  if (!resend) {
    console.error("RESEND_API_KEY isn't set — skipping email.");
    return { ok: false };
  }

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });
  if (error) {
    console.error("Email send failed:", error);
    return { ok: false };
  }
  return { ok: true };
}
