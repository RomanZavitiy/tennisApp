// One basic template for every fallback email (task 5.1-5.2): a heading, a
// line of body text, an optional button to the app, and an unsubscribe
// link. Every notification email looks the same — nobody's reading these
// for their formatting, and a signed-in player sees the real detail (the
// offer, the thread, the result) by following the link anyway.

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export type EmailTemplateInput = {
  heading: string;
  body: string;
  actionUrl: string;
  actionLabel: string;
  unsubscribeUrl: string;
  /** "Turn off email notifications" (task 1.20) — the recipient's own
   * language, resolved by the caller (notify.ts) from their saved locale. */
  unsubscribeLabel: string;
};

export function renderEmailHtml({
  heading,
  body,
  actionUrl,
  actionLabel,
  unsubscribeUrl,
  unsubscribeLabel,
}: EmailTemplateInput): string {
  return `<!doctype html>
<html>
  <body style="font-family: sans-serif; color: #111; max-width: 480px; margin: 0 auto; padding: 24px;">
    <h1 style="font-size: 20px;">${escapeHtml(heading)}</h1>
    <p style="font-size: 15px; line-height: 1.5;">${escapeHtml(body)}</p>
    <p style="margin: 24px 0;">
      <a href="${escapeHtml(actionUrl)}" style="background: #0f172a; color: #fff; padding: 10px 16px; border-radius: 6px; text-decoration: none;">${escapeHtml(actionLabel)}</a>
    </p>
    <p style="font-size: 12px; color: #666; margin-top: 32px;">
      SpinBuddy —
      <a href="${escapeHtml(unsubscribeUrl)}" style="color: #666;">${escapeHtml(unsubscribeLabel)}</a>
    </p>
  </body>
</html>`;
}

export function renderEmailText({
  heading,
  body,
  actionUrl,
  unsubscribeUrl,
  unsubscribeLabel,
}: EmailTemplateInput): string {
  return `${heading}\n\n${body}\n\n${actionUrl}\n\n${unsubscribeLabel}: ${unsubscribeUrl}`;
}
