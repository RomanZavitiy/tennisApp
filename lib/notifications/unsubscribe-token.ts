import { createHmac, timingSafeEqual } from "node:crypto";

// A link-safe proof of identity for "unsubscribe from this email, without
// signing in" (task 5.3) — the id itself plus an HMAC signature over it,
// both base64url, joined by a dot. UNSUBSCRIBE_SECRET (.env.example) is a
// self-generated secret, the same kind CRON_SECRET already is (decision
// 2026-10-15, task 5.8) — not a third-party credential, so there is nothing
// to wait on a human for beyond setting it in Vercel.

function secret(): string {
  const value = process.env.UNSUBSCRIBE_SECRET;
  if (!value) {
    throw new Error("UNSUBSCRIBE_SECRET isn't set.");
  }
  return value;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

/** A token proving `userId`, for an unsubscribe link sent by email. */
export function createUnsubscribeToken(userId: string): string {
  const payload = Buffer.from(userId, "utf8").toString("base64url");
  return `${payload}.${sign(payload)}`;
}

/**
 * The userId a token proves, or null for a missing, forged, or malformed
 * one. Compares signatures with a constant-time check — this is the one
 * endpoint (5.3) a stranger can call with no session at all.
 */
export function verifyUnsubscribeToken(token: string): string | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) {
    return null;
  }

  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(signature);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return null;
  }

  try {
    const userId = Buffer.from(payload, "base64url").toString("utf8");
    return userId.length > 0 ? userId : null;
  } catch {
    return null;
  }
}
